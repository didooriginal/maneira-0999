import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { loadPriceModels } from "./pricing";

/**
 * Modelos prontos (/prontos).
 *
 * Vitrine de artes que já existem prontas: o cliente escolhe, monta a sacola
 * e fecha tudo num WhatsApp só. O preço sai da mesma tabela que o resto do
 * site (`loadPriceModels`), então nunca divergem — e cada modelo pode ter um
 * preço próprio quando o Diego digita um valor no painel.
 *
 * Nada de arte digital nem observação interna sai daqui: essas duas colunas
 * só aparecem nas rotas do painel, autenticadas.
 */

type ReadyRow = typeof schema.readyDesigns.$inferSelect;

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Tipos de produto disponíveis, com o preço de varejo já resolvido. */
export async function readyTypes() {
  const models = await loadPriceModels();
  return models.map((model) => ({
    key: model.key,
    name: model.name,
    retailFrom: model.retailFrom,
  }));
}

/**
 * Versão pública de um modelo pronto.
 * `priceAuto` diz se o valor veio da tabela de preços (true) ou foi digitado
 * à mão no painel (false) — o site usa isso só para explicar o preço.
 */
function serialize(
  row: ReadyRow,
  types: { key: string; name: string; retailFrom: number }[],
) {
  const tipo = types.find((item) => item.key === row.productType);
  const price = row.price ?? tipo?.retailFrom ?? 0;
  const images = parseList(row.imagesJson);

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    description: row.description,
    productType: row.productType,
    typeName: tipo?.name ?? "Personalizado",
    price,
    priceAuto: row.price === null,
    comparePrice: row.comparePrice,
    category: row.category,
    images,
    image: images[0] ?? "/images/hero-mugs.jpg",
    tags: parseList(row.tagsJson),
    featured: row.featured,
    soldOut: row.soldOut,
  };
}

export type ReadyDesign = ReturnType<typeof serialize>;

async function listarVisiveis() {
  const [rows, types] = await Promise.all([
    db
      .select()
      .from(schema.readyDesigns)
      .where(eq(schema.readyDesigns.hidden, false))
      .orderBy(asc(schema.readyDesigns.sortOrder)),
    readyTypes(),
  ]);
  return rows.map((row) => serialize(row, types));
}

export const ready = {
  /** Vitrine com busca, categoria, tag e ordenação. */
  list: base
    .input(
      z
        .object({
          category: z.string().optional(),
          tag: z.string().optional(),
          search: z.string().optional(),
          sort: z
            .enum(["destaques", "menor-preco", "maior-preco", "novidades"])
            .optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      let list = await listarVisiveis();

      if (input?.category && input.category !== "todos") {
        list = list.filter((item) => item.category === input.category);
      }
      if (input?.tag) {
        const tag = input.tag.toLowerCase();
        list = list.filter((item) =>
          item.tags.some((value) => value.toLowerCase() === tag),
        );
      }
      if (input?.search?.trim()) {
        const termo = input.search.toLowerCase().trim();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(termo) ||
            item.code.toLowerCase().includes(termo) ||
            item.description.toLowerCase().includes(termo) ||
            item.category.toLowerCase().includes(termo) ||
            item.tags.some((tag) => tag.toLowerCase().includes(termo)),
        );
      }

      switch (input?.sort) {
        case "menor-preco":
          list = [...list].sort((a, b) => a.price - b.price);
          break;
        case "maior-preco":
          list = [...list].sort((a, b) => b.price - a.price);
          break;
        case "novidades":
          list = [...list].sort((a, b) => b.id - a.id);
          break;
        default:
          // Destaques primeiro, depois a ordem que o Diego arrumou no painel.
          list = [...list].sort(
            (a, b) => Number(b.featured) - Number(a.featured),
          );
          break;
      }

      return list;
    }),

  /** Categorias e tags que existem de fato, com contagem. */
  facets: base.handler(async () => {
    const list = await listarVisiveis();

    const categorias = new Map<string, number>();
    const tags = new Map<string, number>();
    for (const item of list) {
      categorias.set(item.category, (categorias.get(item.category) ?? 0) + 1);
      for (const tag of item.tags) {
        tags.set(tag, (tags.get(tag) ?? 0) + 1);
      }
    }

    const ordenar = (mapa: Map<string, number>) =>
      [...mapa.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      total: list.length,
      categories: ordenar(categorias),
      tags: ordenar(tags).slice(0, 24),
    };
  }),

  /** Página de um modelo pronto, com sugestões da mesma categoria. */
  item: base
    .input(z.object({ slug: z.string().min(1) }))
    .handler(async ({ input }) => {
      const [row] = await db
        .select()
        .from(schema.readyDesigns)
        .where(eq(schema.readyDesigns.slug, input.slug))
        .limit(1);

      if (!row || row.hidden) {
        throw new ORPCError("NOT_FOUND", {
          message: "Esse modelo não está mais na vitrine.",
        });
      }

      const types = await readyTypes();
      const design = serialize(row, types);

      const todos = await listarVisiveis();
      const related = todos
        .filter(
          (item) => item.id !== design.id && item.category === design.category,
        )
        .slice(0, 4);

      return { design, related };
    }),

  /**
   * Confere a sacola no servidor antes de mandar pro WhatsApp: preço, nome e
   * disponibilidade saem do banco, não do que ficou guardado no navegador.
   */
  checkBag: base
    .input(
      z.object({
        items: z
          .array(
            z.object({
              slug: z.string().min(1),
              quantity: z.number().int().min(1).max(999),
            }),
          )
          .min(1)
          .max(50),
      }),
    )
    .handler(async ({ input }) => {
      const list = await listarVisiveis();
      const bySlug = new Map(list.map((item) => [item.slug, item]));

      const items = input.items
        .map((pedido) => {
          const design = bySlug.get(pedido.slug);
          if (!design) return null;
          return {
            slug: design.slug,
            code: design.code,
            name: design.name,
            typeName: design.typeName,
            unitPrice: design.price,
            quantity: pedido.quantity,
            soldOut: design.soldOut,
            total: design.price * pedido.quantity,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const indisponiveis = input.items
        .filter((pedido) => !bySlug.has(pedido.slug))
        .map((pedido) => pedido.slug);

      // Item que ficou esgotado depois de entrar na sacola continua na lista
      // (para o cliente ver e tirar), mas não entra na conta.
      const validos = items.filter((item) => !item.soldOut);
      const pieces = validos.reduce((soma, item) => soma + item.quantity, 0);
      const total = validos.reduce((soma, item) => soma + item.total, 0);

      return { items, indisponiveis, pieces, total };
    }),
};
