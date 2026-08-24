import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Tabela de preços da Caneca Maneira.
 *
 * `retail` = preço de venda no varejo (1 unidade), usado no catálogo.
 * `tiers` = preço por unidade no atacado, por faixa de quantidade.
 *
 * Fonte: tabela de precificação do cliente (insumo x venda varejo + atacado).
 * Preços de varejo confirmados pelo cliente. As faixas de atacado dos modelos
 * de chopp e polímero são referências sugeridas (não vieram na tabela).
 */

import { MIN_B2B } from "../../web/lib/site";

export { MIN_B2B };

export interface PriceTier {
  min: number;
  max: number;
  unit: number;
  label: string;
}

export interface PriceModel {
  key: string;
  name: string;
  /** Faixa de varejo divulgada, em texto. */
  retailRange: string;
  retailFrom: number;
  retailTo: number;
  /** Marcado quando o valor é estimado e ainda não foi confirmado. */
  estimated: boolean;
  tiers: PriceTier[];
}

function tiers(
  unit1: number,
  unit15: number,
  unit51: number,
  unit100: number,
  unit500: number,
): PriceTier[] {
  return [
    { min: 1, max: 14, unit: unit1, label: "1 a 14 unidades (varejo)" },
    { min: 15, max: 50, unit: unit15, label: "15 a 50 unidades" },
    { min: 51, max: 99, unit: unit51, label: "51 a 99 unidades" },
    { min: 100, max: 499, unit: unit100, label: "100 a 499 unidades" },
    { min: 500, max: 100000, unit: unit500, label: "500+ unidades" },
  ];
}

export const priceModels: PriceModel[] = [
  {
    key: "branca",
    name: "Porcelana branca padrão 325ml",
    retailRange: "R$ 35,00 a R$ 39,90",
    retailFrom: 35,
    retailTo: 39.9,
    estimated: false,
    tiers: tiers(37.9, 25, 20, 16, 14),
  },
  {
    key: "colorida",
    name: "Cerâmica com alça e interior coloridos",
    retailRange: "R$ 39,80 a R$ 43,70",
    retailFrom: 39.8,
    retailTo: 43.7,
    estimated: false,
    tiers: tiers(43.7, 32, 28, 26, 22),
  },
  {
    key: "glitter",
    name: "Cerâmica com base glitter",
    retailRange: "R$ 47,50 a R$ 65,90",
    retailFrom: 47.5,
    retailTo: 65.9,
    estimated: false,
    tiers: tiers(65.9, 45, 38, 36, 32),
  },
  {
    key: "magica",
    name: "Mágica colorida (revela a imagem)",
    retailRange: "R$ 59,90 a R$ 89,90",
    retailFrom: 59.9,
    retailTo: 89.9,
    estimated: false,
    tiers: tiers(89.9, 55, 45, 42, 38),
  },
  {
    key: "chopp-jateado",
    name: "Chopp vidro jateado/fosco 475ml",
    retailRange: "R$ 55,00 a R$ 75,00",
    retailFrom: 55,
    retailTo: 75,
    estimated: false,
    tiers: tiers(69.9, 52, 46, 42, 38),
  },
  {
    key: "chopp-transparente",
    name: "Chopp vidro transparente 475ml",
    retailRange: "R$ 45,00 a R$ 65,00",
    retailFrom: 45,
    retailTo: 65,
    estimated: false,
    tiers: tiers(59.9, 44, 39, 35, 32),
  },
  {
    key: "camisa-sublimacao",
    name: "Camisa sublimação (arte localizada)",
    retailRange: "R$ 40,00",
    retailFrom: 40,
    retailTo: 40,
    estimated: false,
    tiers: tiers(40, 36, 33, 30, 28),
  },
  {
    key: "camisa-total",
    name: "Camisa sublimação total (arte na peça inteira)",
    retailRange: "R$ 55,00",
    retailFrom: 55,
    retailTo: 55,
    estimated: false,
    tiers: tiers(55, 50, 46, 42, 39),
  },
  {
    key: "azulejo",
    name: "Azulejo personalizado com suporte",
    retailRange: "R$ 35,00",
    retailFrom: 35,
    retailTo: 35,
    estimated: false,
    tiers: tiers(35, 31, 28, 25, 23),
  },
  {
    key: "polimero",
    name: "Polímero branca 325ml (inquebrável)",
    retailRange: "R$ 25,00 a R$ 35,00",
    retailFrom: 25,
    retailTo: 35,
    estimated: false,
    tiers: tiers(29.9, 22, 19, 15, 13),
  },
];

/** Rótulos do formulário de orçamento → modelo de preço. */
export const quoteOptionToModel: Record<string, string | null> = {
  "Caneca temática": "branca",
  "Caneca colorida": "colorida",
  "Caneca de chopp (vidro jateado)": "chopp-jateado",
  "Caneca de chopp (vidro transparente)": "chopp-transparente",
  "Caneca para crianças (polímero inquebrável)": "polimero",
  "Caneca mágica": "magica",
  "Caneca glitter": "glitter",
  "Caneca com caricatura": "branca",
  "Caneca com historinha personalizada": "branca",
  "Camisa sublimação": "camisa-sublimacao",
  "Camisa sublimação total": "camisa-total",
  "Azulejo personalizado": "azulejo",
  "Ainda não sei": "branca",
};

/**
 * Acréscimo por produção urgente (entrega no dia útil seguinte).
 * Acima de `maxQuantity` peças o prazo de 1 dia útil não é garantido:
 * o site pede para combinar no WhatsApp em vez de prometer.
 */
export const RUSH = {
  label: "Urgente (1 dia útil)",
  pct: 0.2,
  maxQuantity: 5,
} as const;

/** Prazos oferecidos no formulário, do mais folgado ao mais apertado. */
export const deadlines = [
  "Sem pressa (15+ dias)",
  "Em até 15 dias",
  "Em até 7 dias",
  "Em até 3 dias",
  RUSH.label,
];

/** Calcula o acréscimo de urgência para uma quantidade. */
export function rushFor(quantity: number, rush: boolean) {
  const overLimit = rush && quantity > RUSH.maxQuantity;
  return {
    applies: rush && !overLimit,
    overLimit,
    pct: RUSH.pct,
    maxQuantity: RUSH.maxQuantity,
  };
}

export function findTier(modelKey: string, quantity: number) {
  const model = priceModels.find((item) => item.key === modelKey);
  if (!model) return null;
  const tier =
    model.tiers.find((item) => quantity >= item.min && quantity <= item.max) ??
    model.tiers[model.tiers.length - 1];
  return { model, tier };
}

/**
 * As 3 linhas em destaque no site. Cada uma leva ao formulário de pedido
 * personalizado — não há carrinho nem compra direta neste momento.
 */
export interface ProductLine {
  slug: string;
  name: string;
  tagline: string;
  fromPrice: number;
  priceNote: string;
  /** Preço por peça a partir do mínimo de atacado — calculado, não fixo. */
  wholesaleFrom?: number;
  wholesaleNote?: string;
  image: string;
  color: string;
  /** Opções mostradas no formulário para esta linha. */
  options: string[];
  bullets: string[];
}

export const productLines: ProductLine[] = [
  {
    slug: "caneca",
    name: "Caneca Personalizada",
    tagline: "Do seu jeito: foto, frase, logo ou personagem.",
    fromPrice: 25,
    priceNote: "a partir de R$ 25,00",
    image: "/images/cat-tematicas.jpg",
    color: "#7BC7EF",
    options: [
      "Caneca temática",
      "Caneca colorida",
      "Caneca glitter",
      "Caneca mágica",
      "Caneca de chopp (vidro jateado)",
      "Caneca de chopp (vidro transparente)",
      "Caneca para crianças (polímero inquebrável)",
      "Caneca com caricatura",
      "Caneca com historinha personalizada",
      "Ainda não sei",
    ],
    bullets: [
      "Porcelana, polímero, vidro ou mágica",
      "Prova digital antes de produzir",
      "Impressão 360° que não descasca",
    ],
  },
  {
    slug: "camisa",
    name: "Camisa Personalizada",
    tagline: "Sublimação localizada ou na peça inteira.",
    fromPrice: 40,
    priceNote: "a partir de R$ 40,00",
    image: "/images/linha-camisa.jpg",
    color: "#EC008B",
    options: ["Camisa sublimação", "Camisa sublimação total"],
    bullets: [
      "Sublimação localizada — R$ 40,00",
      "Sublimação total — R$ 55,00",
      "Uniformes, times, eventos e campanhas",
    ],
  },
  {
    slug: "azulejo",
    name: "Azulejo Personalizado",
    tagline: "Sua foto ou frase virando decoração.",
    fromPrice: 35,
    priceNote: "R$ 35,00",
    image: "/images/linha-azulejo.jpg",
    color: "#EEDA10",
    options: ["Azulejo personalizado"],
    bullets: [
      "Acompanha suporte de mesa",
      "Cores vivas e brilho permanente",
      "Presente, lembrancinha ou decoração",
    ],
  },
];

export function findLine(slug: string) {
  return productLines.find((line) => line.slug === slug) ?? null;
}

/* ------------------------------------------------------------------------ *
 * Preços editáveis pelo painel
 *
 * `priceModels` acima continua sendo o padrão de fábrica. O que o Diego
 * salvar no painel entra como sobrescrita na tabela `price_overrides` e é
 * mesclado aqui. Tudo que precifica no site (catálogo, /empresas,
 * orçamentos e o atendente de IA) passa por `loadPriceModels`, então não
 * existe caminho onde o site mostre um valor e a IA diga outro.
 * ------------------------------------------------------------------------ */

/** Valida o JSON de faixas vindo do banco antes de confiar nele. */
function parseTiers(raw: string | null): PriceTier[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const tiers = parsed.map((item) => ({
      min: Number(item.min),
      max: Number(item.max),
      unit: Number(item.unit),
      label: String(item.label ?? ""),
    }));
    const valido = tiers.every(
      (tier) =>
        Number.isFinite(tier.min) &&
        Number.isFinite(tier.max) &&
        Number.isFinite(tier.unit) &&
        tier.unit > 0 &&
        tier.min <= tier.max,
    );
    return valido ? tiers : null;
  } catch {
    return null;
  }
}

/**
 * Modelos de preço já com as edições do painel aplicadas.
 * Se o banco falhar, cai no padrão do código em vez de quebrar a página.
 */
export async function loadPriceModels(): Promise<PriceModel[]> {
  try {
    const rows = await db.select().from(schema.priceOverrides);
    if (rows.length === 0) return priceModels;

    const byKey = new Map(rows.map((row) => [row.modelKey, row]));

    return priceModels.map((model) => {
      const override = byKey.get(model.key);
      if (!override) return model;

      const tiers = parseTiers(override.tiersJson) ?? model.tiers;
      const retailFrom = override.retailFrom ?? model.retailFrom;
      const retailTo = override.retailTo ?? model.retailTo;

      return {
        ...model,
        retailFrom,
        retailTo,
        retailRange:
          retailFrom === retailTo
            ? formatBRL(retailFrom)
            : `${formatBRL(retailFrom)} a ${formatBRL(retailTo)}`,
        // Editado pelo dono do negócio: não é mais estimativa nossa.
        estimated: false,
        tiers,
      };
    });
  } catch (error) {
    console.error("[pricing] falha ao ler price_overrides, usando padrão:", error);
    return priceModels;
  }
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * As 3 linhas da home com o preço vindo da tabela viva (já com o que o Diego
 * editou no painel), em vez do texto fixo que ficava congelado no código.
 *
 * Antes o "a partir de R$ 25,00" era escrito à mão em `productLines`: bastava
 * o Diego mudar o preço no painel para o site passar a mentir. Agora o valor
 * é o menor preço de varejo entre os modelos que a linha oferece.
 */
export async function loadProductLines(): Promise<ProductLine[]> {
  const models = await loadPriceModels();
  const byKey = new Map(models.map((model) => [model.key, model]));

  return productLines.map((line) => {
    /* Todos os modelos de preço que esta linha oferece no formulário. */
    const usados = line.options
      .map((option) => quoteOptionToModel[option])
      .filter((key): key is string => Boolean(key))
      .map((key) => byKey.get(key))
      .filter((model): model is PriceModel => Boolean(model));

    if (usados.length === 0) return line;

    const menor = Math.min(...usados.map((model) => model.retailFrom));

    /* Menor preço no atacado a partir do mínimo de peças — é o número que
       convence a empresa a pedir orçamento. */
    const menorAtacado = Math.min(
      ...usados.map((model) => {
        const tier =
          model.tiers.find(
            (item) => MIN_B2B >= item.min && MIN_B2B <= item.max,
          ) ?? model.tiers[model.tiers.length - 1];
        return tier.unit;
      }),
    );

    return {
      ...line,
      fromPrice: menor,
      priceNote: `a partir de ${formatBRL(menor)}`,
      wholesaleFrom: menorAtacado,
      wholesaleNote: `${MIN_B2B}+ peças: ${formatBRL(menorAtacado)} cada`,
    };
  });
}

/** Versão assíncrona de `findTier`, já com as edições do painel. */
export async function findTierLive(modelKey: string, quantity: number) {
  const models = await loadPriceModels();
  const model = models.find((item) => item.key === modelKey);
  if (!model) return null;
  const tier =
    model.tiers.find((item) => quantity >= item.min && quantity <= item.max) ??
    model.tiers[model.tiers.length - 1];
  return { model, tier };
}
