import { z } from "zod";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { lerHero } from "../lib/hero";
import { lerAvaliacoes } from "../lib/avaliacoes";
import { lerPopupAtivo } from "../lib/popup";

type ProductRow = typeof schema.products.$inferSelect;

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function serializeProduct(row: ProductRow) {
  return {
    ...row,
    colorOptions: parseList(row.colorOptions),
    sizeOptions: parseList(row.sizeOptions),
    highlights: parseList(row.highlights),
  };
}

export type Product = ReturnType<typeof serializeProduct>;

export const catalog = {
  categories: base.handler(async () =>
    db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder)),
  ),

  products: base
    .input(
      z
        .object({
          category: z.string().optional(),
          featuredOnly: z.boolean().optional(),
          search: z.string().optional(),
          sort: z
            .enum(["relevancia", "menor-preco", "maior-preco", "avaliacao"])
            .optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.hidden, false))
        .orderBy(asc(schema.products.sortOrder));

      let list = rows.map(serializeProduct);

      if (input?.category && input.category !== "todos") {
        list = list.filter((p) => p.categorySlug === input.category);
      }
      if (input?.featuredOnly) {
        list = list.filter((p) => p.featured);
      }
      if (input?.search) {
        const term = input.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.shortDescription.toLowerCase().includes(term),
        );
      }
      switch (input?.sort) {
        case "menor-preco":
          list = [...list].sort((a, b) => a.price - b.price);
          break;
        case "maior-preco":
          list = [...list].sort((a, b) => b.price - a.price);
          break;
        case "avaliacao":
          list = [...list].sort((a, b) => b.rating - a.rating);
          break;
        default:
          break;
      }
      return list;
    }),

  product: base
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input }) => {
      const [row] = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.slug, input.slug));
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Caneca não encontrada" });

      const related = await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.categorySlug, row.categorySlug),
            eq(schema.products.hidden, false),
          ),
        )
        .orderBy(asc(schema.products.sortOrder));

      return {
        product: serializeProduct(row),
        related: related
          .filter((p) => p.id !== row.id)
          .slice(0, 3)
          .map(serializeProduct),
      };
    }),

  testimonials: base.handler(async () =>
    db
      .select()
      .from(schema.testimonials)
      .orderBy(asc(schema.testimonials.sortOrder)),
  ),

  gallery: base.handler(async () =>
    db
      .select()
      .from(schema.galleryItems)
      .orderBy(asc(schema.galleryItems.sortOrder)),
  ),

  /**
   * Faixa sazonal que está valendo hoje (Dia dos Pais, Natal...).
   * A data é resolvida no fuso de São Paulo — o servidor pode estar em UTC,
   * e uma faixa que termina "hoje" tem que valer até o fim do dia no Brasil.
   * Devolve no máximo uma: a que começou mais recentemente.
   */
  activeBanner: base.handler(async () => {
    const hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const rows = await db
      .select()
      .from(schema.seasonalBanners)
      .where(
        and(
          eq(schema.seasonalBanners.active, true),
          lte(schema.seasonalBanners.startsOn, hoje),
          gte(schema.seasonalBanners.endsOn, hoje),
        ),
      )
      .orderBy(desc(schema.seasonalBanners.startsOn))
      .limit(1);

    return rows[0] ?? null;
  }),

  /** Topo da home: foto, títulos e selinhos, editáveis no painel. */
  hero: base.handler(async () => lerHero()),

  /** Popup de novidade/promoção. null = desligado ou fora do período. */
  popup: base.handler(async () => lerPopupAtivo()),

  /** Nota do Google mostrada na home, editável no painel. */
  avaliacoes: base.handler(async () => lerAvaliacoes()),
};
