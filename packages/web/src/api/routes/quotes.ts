import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { findTier, priceModels, quoteOptionToModel } from "./pricing";

function makeCode() {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `ORC-${Date.now().toString(36).toUpperCase().slice(-5)}${rand}`;
}

export const quotes = {
  create: base
    .input(
      z.object({
        name: z.string().min(3),
        email: z.email(),
        phone: z.string().min(8),
        clientType: z.enum(["pessoal", "empresa"]),
        company: z.string().optional(),
        quantity: z.number().int().min(1).max(100000),
        mugType: z.string().min(2),
        deadline: z.string().optional(),
        hasArt: z.enum(["tenho-arte", "tenho-ideia", "preciso-de-ajuda"]),
        artUrl: z.string().optional(),
        message: z.string().min(5).max(2000),
      }),
    )
    .handler(async ({ input }) => {
      const [row] = await db
        .insert(schema.quotes)
        .values({
          code: makeCode(),
          name: input.name,
          email: input.email,
          phone: input.phone,
          clientType: input.clientType,
          company: input.company ?? null,
          quantity: input.quantity,
          mugType: input.mugType,
          deadline: input.deadline ?? null,
          hasArt: input.hasArt,
          artUrl: input.artUrl ?? null,
          message: input.message,
        })
        .returning();

      return { code: row.code };
    }),

  /** Tabela de preços por modelo e faixa de quantidade. */
  priceTiers: base.handler(() => ({
    models: priceModels,
    optionToModel: quoteOptionToModel,
  })),

  /** Estimativa calculada no servidor a partir do modelo e da quantidade. */
  estimate: base
    .input(
      z.object({
        option: z.string().min(2),
        quantity: z.number().int().min(1).max(100000),
      }),
    )
    .handler(({ input }) => {
      const modelKey = quoteOptionToModel[input.option] ?? null;
      if (!modelKey) return null;
      const found = findTier(modelKey, input.quantity);
      if (!found) return null;
      return {
        modelName: found.model.name,
        estimated: found.model.estimated,
        unit: found.tier.unit,
        tierLabel: found.tier.label,
        total: found.tier.unit * input.quantity,
      };
    }),
};
