import { tool } from "ai";
import { asc, eq } from "drizzle-orm";
import z from "zod";
import { db } from "../../database";
import * as schema from "../../database/schema";
import {
  loadPriceModels,
  productLines,
  quoteOptionToModel,
} from "../../routes/pricing";

/**
 * Lista os modelos realmente cadastrados no catálogo. Serve para o atendente
 * recomendar apenas o que existe, com o link certo (/caneca/{slug}).
 */
export const listarCatalogo = tool({
  description:
    "Lista os modelos do catálogo do site, com nome, preço de varejo, categoria e link. Use antes de recomendar qualquer modelo, para não inventar produto que não existe.",
  inputSchema: z.object({}),
  async execute() {
    const rows = await db
      .select({
        slug: schema.products.slug,
        name: schema.products.name,
        shortDescription: schema.products.shortDescription,
        price: schema.products.price,
        categorySlug: schema.products.categorySlug,
      })
      .from(schema.products)
      .where(eq(schema.products.hidden, false))
      .orderBy(asc(schema.products.sortOrder));

    return {
      produtos: rows.map((row) => ({
        nome: row.name,
        resumo: row.shortDescription,
        precoVarejo: row.price,
        categoria: row.categorySlug,
        link: `/caneca/${row.slug}`,
      })),
      linhas: productLines.map((line) => ({
        nome: line.name,
        aPartirDe: line.fromPrice,
        opcoesDoFormulario: line.options,
      })),
    };
  },
});

/**
 * Rótulos aceitos pela calculadora. O atendente precisa usar exatamente um
 * destes ao pedir estimativa, senão a calculadora devolve nulo.
 */
export const listarOpcoesDePreco = tool({
  description:
    "Lista os rótulos de produto aceitos pela calculadora de preço e os materiais disponíveis. Use quando não tiver certeza de qual rótulo passar para a ferramenta de estimativa.",
  inputSchema: z.object({}),
  async execute() {
    const models = await loadPriceModels();
    return {
      rotulosAceitos: Object.keys(quoteOptionToModel),
      materiais: models.map((model) => ({
        nome: model.name,
        faixaDeVarejo: model.retailRange,
      })),
    };
  },
});
