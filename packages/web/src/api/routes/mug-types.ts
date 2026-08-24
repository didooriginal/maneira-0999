import { asc, eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { loadPriceModels } from "./pricing";

/**
 * Tipos de caneca (/modelos).
 *
 * Aqui o cliente descobre o que existe fisicamente: branca, com colher, de
 * chopp, polímero... e a partir de quanto sai cada um. Não é arte pronta
 * (isso é /prontos) nem foto de trabalho entregue (isso é /catalogo).
 *
 * O preço nunca é digitado em dois lugares: se o painel não tiver um valor
 * manual, ele sai de `loadPriceModels()`, a mesma fonte do orçamento e da IA.
 */

type MugTypeRow = typeof schema.mugTypes.$inferSelect;

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function serializeMugType(
  row: MugTypeRow,
  models: { key: string; retailFrom: number }[],
) {
  const model = row.priceModelKey
    ? (models.find((item) => item.key === row.priceModelKey) ?? null)
    : null;
  const priceFrom = row.priceManual ?? model?.retailFrom ?? null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    /* Sempre sobra alguma foto: sem a estampada o card ficaria com buraco. */
    imagePrinted: row.imagePrinted || "/images/hero-mugs.jpg",
    imageBlank: row.imageBlank || null,
    priceFrom,
    /* true = veio da tabela de preços; false = valor digitado no painel. */
    priceAuto: row.priceManual === null && model !== null,
    priceLabel:
      priceFrom === null
        ? "Preço sob consulta"
        : row.priceManual !== null
          ? brl(priceFrom)
          : `a partir de ${brl(priceFrom)}`,
    quoteOption: row.quoteOption,
    highlights: parseList(row.highlightsJson),
    badge: row.badge,
    featured: row.featured,
  };
}

export type MugType = ReturnType<typeof serializeMugType>;

export const mugTypes = {
  /** Todos os tipos visíveis, na ordem definida no painel. */
  list: base.handler(async () => {
    const [rows, models] = await Promise.all([
      db
        .select()
        .from(schema.mugTypes)
        .where(eq(schema.mugTypes.hidden, false))
        .orderBy(asc(schema.mugTypes.sortOrder)),
      loadPriceModels(),
    ]);
    return rows.map((row) => serializeMugType(row, models));
  }),
};
