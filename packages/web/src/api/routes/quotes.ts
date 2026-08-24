import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { notifyNewQuote } from "../services/whatsapp-alert";
import {
  RUSH,
  deadlines,
  findTierLive,
  loadPriceModels,

  loadProductLines,
  quoteOptionToModel,
  rushFor,
} from "./pricing";

function makeCode() {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORC-${Date.now().toString(36).toUpperCase().slice(-5)}${rand}`;
}

export type QuoteInput = {
  /** De onde veio o pedido — só usado no aviso do WhatsApp. */
  origin?: "formulario" | "chat";
  name: string;
  phone: string;
  clientType: "pessoal" | "empresa";
  company?: string | null;
  quantity: number;
  mugType: string;
  productLine?: "caneca" | "camisa" | "azulejo";
  cep?: string | null;
  shippingChoice?: string | null;
  deadline?: string | null;
  hasArt: "tenho-arte" | "tenho-ideia" | "preciso-de-ajuda";
  artUrl?: string | null;
  message: string;
};

/**
 * Grava um orçamento. Fonte única usada pelo formulário do site e pelo
 * atendente de IA — os dois caem na mesma tabela e aparecem no mesmo painel.
 */
export async function insertQuote(input: QuoteInput) {
  const [row] = await db
    .insert(schema.quotes)
    .values({
      code: makeCode(),
      name: input.name,
      phone: input.phone,
      clientType: input.clientType,
      company: input.company ?? null,
      quantity: input.quantity,
      mugType: input.mugType,
      productLine: input.productLine ?? "caneca",
      cep: input.cep ?? null,
      shippingChoice: input.shippingChoice ?? null,
      deadline: input.deadline ?? null,
      hasArt: input.hasArt,
      artUrl: input.artUrl ?? null,
      message: input.message,
    })
    .returning();

  // Aviso no WhatsApp da equipe. Fire-and-forget de propósito: se o CallMeBot
  // falhar, o orçamento continua salvo e visível no painel.
  try {
    const estimate = await estimateForOption(input.mugType, input.quantity, false);
    notifyNewQuote({
      code: row.code,
      name: input.name,
      phone: input.phone,
      clientType: input.clientType,
      company: input.company ?? null,
      quantity: input.quantity,
      mugType: input.mugType,
      productLine: input.productLine ?? "caneca",
      cep: input.cep ?? null,
      shippingChoice: input.shippingChoice ?? null,
      deadline: input.deadline ?? null,
      hasArt: input.hasArt,
      message: input.message,
      origin: input.origin ?? "formulario",
      estimateTotal: estimate?.total ?? null,
    });
  } catch (error) {
    console.error("[quotes] aviso de WhatsApp falhou:", error);
  }

  return { code: row.code };
}

/** Estimativa de varejo/atacado a partir do rótulo do formulário. */
export async function estimateForOption(
  option: string,
  quantity: number,
  rush = false,
) {
  const modelKey = quoteOptionToModel[option] ?? null;
  if (!modelKey) return null;
  const found = await findTierLive(modelKey, quantity);
  if (!found) return null;
  const subtotal = found.tier.unit * quantity;
  const urgency = rushFor(quantity, rush);
  const rushFee = urgency.applies ? subtotal * urgency.pct : 0;
  return {
    modelName: found.model.name,
    estimated: found.model.estimated,
    unit: found.tier.unit,
    tierLabel: found.tier.label,
    subtotal,
    rushFee,
    rushApplied: urgency.applies,
    rushOverLimit: urgency.overLimit,
    rushMaxQuantity: urgency.maxQuantity,
    total: subtotal + rushFee,
  };
}

export const quotes = {
  create: base
    .input(
      z.object({
        name: z.string().min(3),
        phone: z.string().min(8),
        clientType: z.enum(["pessoal", "empresa"]),
        company: z.string().optional(),
        quantity: z.number().int().min(1).max(100000),
        mugType: z.string().min(2),
        productLine: z.enum(["caneca", "camisa", "azulejo"]).default("caneca"),
        cep: z.string().optional(),
        shippingChoice: z.string().optional(),
        deadline: z.string().optional(),
        hasArt: z.enum(["tenho-arte", "tenho-ideia", "preciso-de-ajuda"]),
        artUrl: z.string().optional(),
        message: z.string().min(5).max(2000),
      }),
    )
    .handler(({ input }) => insertQuote(input)),

  /** Tabela de preços por modelo e faixa de quantidade. */
  priceTiers: base.handler(async () => ({
    models: await loadPriceModels(),
    optionToModel: quoteOptionToModel,
    rush: RUSH,
    deadlines,
  })),

  /**
   * As 3 linhas em destaque (caneca, camisa, azulejo), com o preço lido da
   * tabela viva — o que o Diego edita no painel aparece na home.
   */
  lines: base.handler(() => loadProductLines()),

  /**
   * Estimativa de atacado a partir da chave do modelo (usada na página
   * /empresas). Calcula também a economia em relação ao preço de varejo.
   */
  estimateModel: base
    .input(
      z.object({
        modelKey: z.string().min(2),
        quantity: z.number().int().min(1).max(100000),
      }),
    )
    .handler(async ({ input }) => {
      const found = await findTierLive(input.modelKey, input.quantity);
      if (!found) return null;
      const retailUnit = found.model.tiers[0].unit;
      const unit = found.tier.unit;
      const total = unit * input.quantity;
      const retailTotal = retailUnit * input.quantity;
      return {
        modelKey: found.model.key,
        modelName: found.model.name,
        estimated: found.model.estimated,
        unit,
        retailUnit,
        total,
        retailTotal,
        saving: Math.max(0, retailTotal - total),
        savingPct:
          retailUnit > 0
            ? Math.round(((retailUnit - unit) / retailUnit) * 100)
            : 0,
        tierLabel: found.tier.label,
      };
    }),

  /** Estimativa calculada no servidor a partir do modelo e da quantidade. */
  estimate: base
    .input(
      z.object({
        option: z.string().min(2),
        quantity: z.number().int().min(1).max(100000),
        rush: z.boolean().default(false),
      }),
    )
    .handler(({ input }) =>
      estimateForOption(input.option, input.quantity, input.rush),
    ),
};
