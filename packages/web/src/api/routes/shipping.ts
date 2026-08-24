import { z } from "zod";
import { base } from "../__core/app";

/**
 * Cálculo de frete.
 *
 * Com MELHOR_ENVIO_TOKEN configurado, cotamos de verdade na API do Melhor Envio
 * (Correios PAC/SEDEX, Jadlog e demais transportadoras da conta).
 * Sem token, devolvemos uma estimativa por região a partir do prefixo do CEP,
 * sempre marcada com `estimated: true` para o site avisar o cliente.
 */

const ORIGIN_CEP = "20050-000"; // Centro, Rio de Janeiro — Mercado Popular Uruguaiana

/** Caixa média por quantidade de peças (cm / kg), com folga para o plástico-bolha. */
function boxFor(quantity: number) {
  const perBox = 6;
  const boxes = Math.max(1, Math.ceil(quantity / perBox));
  const inBox = Math.min(quantity, perBox);
  return {
    height: inBox <= 2 ? 12 : 24,
    width: inBox <= 2 ? 12 : 24,
    length: inBox <= 2 ? 12 : 36,
    weight: Number((0.45 * inBox + 0.25).toFixed(2)),
    boxes,
  };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Estimativa por região quando não há token configurado. */
function fallbackQuote(cep: string, quantity: number) {
  const prefix = Number(cep.slice(0, 2));
  const { boxes } = boxFor(quantity);

  let region = "Brasil";
  let pac = 32;
  let sedex = 52;
  let days = 8;

  if (prefix >= 20 && prefix <= 28) {
    region = "Rio de Janeiro";
    pac = 22;
    sedex = 34;
    days = 3;
  } else if ((prefix >= 1 && prefix <= 19) || prefix === 29 || (prefix >= 30 && prefix <= 39)) {
    region = "Sudeste";
    pac = 27;
    sedex = 42;
    days = 5;
  } else if (prefix >= 80 && prefix <= 99) {
    region = "Sul";
    pac = 33;
    sedex = 54;
    days = 7;
  } else if (prefix >= 40 && prefix <= 65) {
    region = "Nordeste";
    pac = 38;
    sedex = 62;
    days = 9;
  } else if (prefix >= 66 && prefix <= 79) {
    region = "Norte / Centro-Oeste";
    pac = 42;
    sedex = 68;
    days = 10;
  }

  const factor = 1 + (boxes - 1) * 0.7;

  return {
    estimated: true,
    region,
    options: [
      {
        id: "pac",
        name: "PAC (Correios)",
        company: "Correios",
        price: Number((pac * factor).toFixed(2)),
        deliveryDays: days,
      },
      {
        id: "sedex",
        name: "SEDEX (Correios)",
        company: "Correios",
        price: Number((sedex * factor).toFixed(2)),
        deliveryDays: Math.max(1, Math.round(days / 2)),
      },
    ],
  };
}

interface MelhorEnvioService {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  company?: { name?: string };
  error?: string;
}

/** CEP recusado pelo Melhor Envio (não existe na base dos Correios). */
class InvalidCepError extends Error {
  constructor() {
    super("CEP não encontrado");
    this.name = "InvalidCepError";
  }
}

async function melhorEnvioQuote(cep: string, quantity: number, token: string) {
  const box = boxFor(quantity);

  const response = await fetch(
    "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Caneca Maneira (https://canecamaneira.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: onlyDigits(ORIGIN_CEP) },
        to: { postal_code: cep },
        package: {
          height: box.height,
          width: box.width,
          length: box.length,
          weight: box.weight * box.boxes,
        },
      }),
    },
  );

  // 422 com erro em `postal_code` = CEP inexistente. Avisamos em vez de
  // devolver uma estimativa para um endereço que não existe.
  if (response.status === 422) {
    const body = (await response.json().catch(() => null)) as {
      errors?: Record<string, unknown>;
    } | null;
    if (body?.errors && "postal_code" in body.errors) {
      throw new InvalidCepError();
    }
    throw new Error("Melhor Envio HTTP 422");
  }

  if (!response.ok) throw new Error(`Melhor Envio HTTP ${response.status}`);

  const data = (await response.json()) as MelhorEnvioService[];
  const options = data
    .filter((item) => !item.error && (item.price ?? item.custom_price))
    .map((item) => ({
      id: String(item.id),
      name: item.name,
      company: item.company?.name ?? "Transportadora",
      price: Number(item.custom_price ?? item.price ?? 0),
      deliveryDays: item.delivery_time ?? 0,
    }))
    .filter((item) => item.price > 0)
    .sort((a, b) => a.price - b.price);

  if (options.length === 0) throw new Error("Sem cotações disponíveis");

  // A conta devolve mais de 10 transportadoras. Mostramos no máximo 4:
  // a mais barata de cada transportadora, começando pela de menor preço.
  const byCompany = new Set<string>();
  const shortlist = options.filter((item) => {
    if (byCompany.has(item.company)) return false;
    byCompany.add(item.company);
    return true;
  });

  return {
    estimated: false,
    region: null as string | null,
    options: shortlist.slice(0, 4),
  };
}

/**
 * Cotação de frete usada tanto pela procedure oRPC do site quanto pelo
 * atendente de IA. Fonte única: as duas nunca podem divergir de valor.
 */
export async function quoteShipping(rawCep: string, quantity: number) {
  const cep = onlyDigits(rawCep);
  if (cep.length !== 8) {
    return { ok: false as const, message: "CEP inválido. Use 8 dígitos." };
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;

  if (token) {
    try {
      const result = await melhorEnvioQuote(cep, quantity, token);
      return { ok: true as const, ...result };
    } catch (error) {
      if (error instanceof InvalidCepError) {
        return {
          ok: false as const,
          message: "CEP não encontrado. Confira os 8 dígitos.",
        };
      }
      console.error("Melhor Envio falhou, usando estimativa:", error);
    }
  }

  return { ok: true as const, ...fallbackQuote(cep, quantity) };
}

export const shipping = {
  quote: base
    .input(
      z.object({
        cep: z.string().min(8).max(9),
        quantity: z.number().int().min(1).max(100000),
      }),
    )
    .handler(({ input }) => quoteShipping(input.cep, input.quantity)),

  /** Endereço de retirada, exibido junto do cálculo. */
  pickup: base.handler(() => pickupInfo),
};

/**
 * Retirada em mãos. Fonte única do site e do atendente de IA.
 * O complemento (apartamento) de Irajá nunca é publicado.
 */
export const pickupInfo = {
  label: "Retirada em mãos (grátis)",
  city: "Rio de Janeiro, RJ",
  points: [
    "Mercado Popular Uruguaiana — Quadra C, nº 107",
    "Rua José Sombra, 336 — Irajá (produção, com horário combinado)",
  ],
};
