import { ORPCError } from "@orpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import {
  assertPassword,
  salvarSenha,
  senhaFoiTrocada,
} from "../lib/admin-auth";
import { HERO_PADRAO, lerHero, salvarHero } from "../lib/hero";
import { POPUP_PADRAO, lerPopup, salvarPopup } from "../lib/popup";
import {
  AVALIACOES_PADRAO,
  lerAvaliacoes,
  salvarAvaliacoes,
} from "../lib/avaliacoes";
import { serializeMugType } from "./mug-types";
import { loadPriceModels } from "./pricing";
import { readyTypes } from "./ready";
import { estaParado } from "../../web/lib/parados";

/**
 * Painel interno (Caneca Maneira).
 * Protegido por senha única definida em ADMIN_PASSWORD no .env.
 * Toda procedure recebe a senha e valida no servidor.
 */

const auth = z.object({ password: z.string().min(1) });

/** "Caneca do Vovô" -> "caneca-do-vovo" */
function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Garante slug único: "caneca-gamer", "caneca-gamer-2", "caneca-gamer-3"... */
async function slugLivre(nome: string) {
  const base = slugify(nome) || "produto";
  const rows = await db.select().from(schema.products);
  const usados = new Set(rows.map((row) => row.slug));
  if (!usados.has(base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const tentativa = `${base}-${n}`;
    if (!usados.has(tentativa)) return tentativa;
  }
  return `${base}-${Date.now()}`;
}

/** Mesmo cuidado do slug de produto, agora na tabela de modelos prontos. */
async function slugLivreReady(nome: string) {
  const base = slugify(nome) || "modelo";
  const rows = await db
    .select({ slug: schema.readyDesigns.slug })
    .from(schema.readyDesigns);
  const usados = new Set(rows.map((row) => row.slug));
  if (!usados.has(base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const tentativa = `${base}-${n}`;
    if (!usados.has(tentativa)) return tentativa;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Próximo código da vitrine: CM-001, CM-002... Continua de onde parou, mesmo
 * que algum modelo tenha sido apagado no meio.
 */
async function proximoCodigo() {
  const rows = await db
    .select({ code: schema.readyDesigns.code })
    .from(schema.readyDesigns);
  const maior = rows.reduce((max, row) => {
    const match = /^CM-(\d+)$/i.exec(row.code.trim());
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `CM-${String(maior + 1).padStart(3, "0")}`;
}

/** Tags sem repetição, sem espaço sobrando e sem diferença de caixa. */
function limparTags(tags: string[]) {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const tag of tags) {
    const limpa = tag.trim().replace(/\s+/g, " ");
    if (!limpa) continue;
    const chave = limpa.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    saida.push(limpa);
  }
  return saida.slice(0, 20);
}

function parseJsonList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Campos do formulário de modelo pronto, compartilhados por criar/editar. */
const readyFields = {
  name: z.string().min(2).max(120),
  /** Vazio = o servidor gera o próximo CM-xxx. */
  code: z.string().max(24).optional(),
  description: z.string().max(2000).optional(),
  productType: z.string().min(2).max(60),
  /** Vazio = preço automático pela tabela de preços. */
  price: z.number().positive().max(100000).nullable().optional(),
  comparePrice: z.number().positive().max(100000).nullable().optional(),
  category: z.string().min(2).max(60),
  images: z.array(z.string().min(1).max(500)).max(8).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  featured: z.boolean().optional(),
  soldOut: z.boolean().optional(),
  hidden: z.boolean().optional(),
  internalNote: z.string().max(2000).optional(),
  artUrl: z.string().max(500).optional(),
  artName: z.string().max(200).optional(),
};

/** Slug único na tabela de tipos de caneca. */
async function slugLivreMugType(nome: string) {
  const base = slugify(nome) || "tipo";
  const rows = await db
    .select({ slug: schema.mugTypes.slug })
    .from(schema.mugTypes);
  const usados = new Set(rows.map((row) => row.slug));
  if (!usados.has(base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const tentativa = `${base}-${n}`;
    if (!usados.has(tentativa)) return tentativa;
  }
  return `${base}-${Date.now()}`;
}

/** Campos do formulário de tipo de caneca, compartilhados por criar/editar. */
const mugTypeFields = {
  name: z.string().min(2).max(120),
  subtitle: z.string().max(160).optional(),
  description: z.string().max(2000).optional(),
  imagePrinted: z.string().max(500).optional(),
  imageBlank: z.string().max(500).optional(),
  /** Vazio = sem tabela de preços; aí vale o valor manual ou "sob consulta". */
  priceModelKey: z.string().max(60).optional(),
  /** Preenchido = ganha da tabela de preços. */
  priceManual: z.number().positive().max(100000).nullable().optional(),
  quoteOption: z.string().max(120).optional(),
  highlights: z.array(z.string().min(1).max(80)).max(6).optional(),
  badge: z.string().max(40).optional(),
  featured: z.boolean().optional(),
  hidden: z.boolean().optional(),
};

/** Mesma lista, tudo opcional: no editar só chega o que mudou. */
const mugTypeFieldsOpcionais = {
  ...mugTypeFields,
  name: mugTypeFields.name.optional(),
};

export const admin = {
  /** Valida a senha sem devolver dados — usado na tela de login. */
  login: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return { ok: true as const, senhaPropria: await senhaFoiTrocada() };
  }),

  /**
   * Troca a senha do painel. Confere a atual, exige uma nova diferente e
   * guarda só o hash. A senha de reserva do servidor continua funcionando.
   */
  changePassword: base
    .input(
      auth.extend({
        novaSenha: z
          .string()
          .min(8, "A senha nova precisa ter pelo menos 8 caracteres.")
          .max(72),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);

      const nova = input.novaSenha.trim();
      if (nova.length < 8) {
        throw new ORPCError("BAD_REQUEST", {
          message: "A senha nova precisa ter pelo menos 8 caracteres.",
        });
      }
      if (nova === input.password) {
        throw new ORPCError("BAD_REQUEST", {
          message: "A senha nova é igual à atual. Escolha outra.",
        });
      }
      if (!/[a-zA-Z]/.test(nova) || !/[0-9]/.test(nova)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Misture letras e números na senha nova.",
        });
      }

      await salvarSenha(nova);
      return { ok: true as const };
    }),

  /** Contadores do topo do painel. */
  summary: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);

    const allQuotes = await db.select().from(schema.quotes);

    const now = Date.now();
    const last7d = allQuotes.filter(
      (quote) => now - new Date(quote.createdAt).getTime() < 7 * 864e5,
    ).length;

    return {
      quotesTotal: allQuotes.length,
      quotesNew: allQuotes.filter((quote) => quote.status === "novo").length,
      quotesClosed: allQuotes.filter((quote) => quote.status === "fechado")
        .length,
      quotesLast7d: last7d,
      /* Leads em aberto há mais de 48h e sem cutucada recente — a fila de
         "cobrar hoje". Mesmo critério da lista na aba Pedidos. */
      quotesStalled: allQuotes.filter((quote) => estaParado(quote, now)).length,
    };
  }),

  /** Pedidos recebidos pelo formulário, mais recentes primeiro. */
  quotes: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.quotes)
      .orderBy(desc(schema.quotes.createdAt))
      .limit(300);
  }),

  /** Atualiza o status de um orçamento. */
  setQuoteStatus: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        status: z.enum(["novo", "respondido", "fechado", "perdido"]),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .update(schema.quotes)
        .set({ status: input.status })
        .where(eq(schema.quotes.id, input.id));
      return { ok: true as const };
    }),

  /**
   * Marca que o Diego cutucou o cliente agora (follow-up no WhatsApp).
   * Com isso o pedido sai da fila de "parados" por alguns dias, em vez de
   * ficar aparecendo todo dia como se ninguém tivesse feito nada.
   *
   * Passar `undo: true` desfaz — para quando o clique foi sem querer.
   */
  nudgeQuote: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        undo: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .update(schema.quotes)
        .set({ nudgedAt: input.undo ? null : new Date() })
        .where(eq(schema.quotes.id, input.id));
      return { ok: true as const };
    }),

  /**
   * Guarda (ou remove) o link da arte final aprovada do pedido.
   * Passar `null` desanexa o arquivo sem apagar o pedido.
   */
  setQuoteFinalArt: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        finalArtUrl: z.string().max(500).nullable(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .update(schema.quotes)
        .set({ finalArtUrl: input.finalArtUrl })
        .where(eq(schema.quotes.id, input.id));
      return { ok: true as const };
    }),

  /**
   * Apaga um pedido de vez. Diferente de produto, pedido é mensagem recebida:
   * spam e teste precisam sair da lista. Não tem volta — a tela confirma antes.
   */
  removeQuote: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db.delete(schema.quotes).where(eq(schema.quotes.id, input.id));
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Catálogo — o Diego edita sozinho pelo painel.
   * Regra combinada: NUNCA apagar produto. Só ocultar do site.
   * ---------------------------------------------------------------- */

  /** Todos os produtos, inclusive os ocultos (o site só mostra os visíveis). */
  products: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.products)
      .orderBy(asc(schema.products.sortOrder));
  }),

  updateProduct: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        name: z.string().min(2).max(120).optional(),
        shortDescription: z.string().min(5).max(300).optional(),
        description: z.string().min(5).max(4000).optional(),
        price: z.number().positive().max(100000).optional(),
        comparePrice: z.number().positive().max(100000).nullable().optional(),
        image: z.string().min(1).max(500).optional(),
        categorySlug: z.string().min(2).max(60).optional(),
        badge: z.string().max(40).nullable().optional(),
        featured: z.boolean().optional(),
        hidden: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _pw, id, ...campos } = input;
      const patch = Object.fromEntries(
        Object.entries(campos).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(patch).length === 0) return { ok: true as const };
      await db
        .update(schema.products)
        .set(patch)
        .where(eq(schema.products.id, id));
      return { ok: true as const };
    }),

  /** Categorias existentes — alimenta o seletor do formulário de produto. */
  categories: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));
  }),

  /**
   * Cria produto novo pelo painel. O slug (endereço da página) sai do nome e
   * ganha sufixo numérico se já existir, para nunca quebrar uma URL antiga.
   */
  createProduct: base
    .input(
      auth.extend({
        name: z.string().min(2).max(120),
        shortDescription: z.string().min(5).max(300),
        description: z.string().min(5).max(4000),
        price: z.number().positive().max(100000),
        comparePrice: z.number().positive().max(100000).nullable().optional(),
        image: z.string().min(1).max(500),
        categorySlug: z.string().min(2).max(60),
        badge: z.string().max(40).nullable().optional(),
        featured: z.boolean().default(false),
        hidden: z.boolean().default(false),
        /** Uma vantagem por linha, aparece em lista na página do produto. */
        highlights: z.array(z.string().min(2).max(160)).max(8).default([]),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);

      const categoria = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, input.categorySlug))
        .limit(1);
      if (categoria.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Essa categoria não existe.",
        });
      }

      const slug = await slugLivre(input.name);
      const existentes = await db.select().from(schema.products);
      const maior = existentes.reduce(
        (max, row) => Math.max(max, row.sortOrder),
        0,
      );

      const [row] = await db
        .insert(schema.products)
        .values({
          slug,
          name: input.name,
          shortDescription: input.shortDescription,
          description: input.description,
          price: input.price,
          comparePrice: input.comparePrice ?? null,
          image: input.image,
          categorySlug: input.categorySlug,
          badge: input.badge ?? null,
          featured: input.featured,
          hidden: input.hidden,
          highlights: JSON.stringify(input.highlights),
          sortOrder: maior + 1,
        })
        .returning();

      return { ok: true as const, id: row.id, slug: row.slug };
    }),

  /** Nova ordem dos produtos: lista de ids na sequência desejada. */
  reorderProducts: base
    .input(auth.extend({ ids: z.array(z.number().int().positive()).min(1) }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await Promise.all(
        input.ids.map((id, index) =>
          db
            .update(schema.products)
            .set({ sortOrder: index + 1 })
            .where(eq(schema.products.id, id)),
        ),
      );
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Galeria
   * ---------------------------------------------------------------- */

  gallery: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.galleryItems)
      .orderBy(asc(schema.galleryItems.sortOrder));
  }),

  addGalleryItem: base
    .input(
      auth.extend({
        title: z.string().min(2).max(120),
        tag: z.string().min(2).max(40),
        image: z.string().min(1).max(500),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const rows = await db.select().from(schema.galleryItems);
      const maior = rows.reduce((max, row) => Math.max(max, row.sortOrder), 0);
      const [row] = await db
        .insert(schema.galleryItems)
        .values({
          title: input.title,
          tag: input.tag,
          image: input.image,
          sortOrder: maior + 1,
        })
        .returning();
      return { ok: true as const, id: row.id };
    }),

  updateGalleryItem: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        title: z.string().min(2).max(120).optional(),
        tag: z.string().min(2).max(40).optional(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _pw, id, ...campos } = input;
      const patch = Object.fromEntries(
        Object.entries(campos).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(patch).length === 0) return { ok: true as const };
      await db
        .update(schema.galleryItems)
        .set(patch)
        .where(eq(schema.galleryItems.id, id));
      return { ok: true as const };
    }),

  /** Aqui remover é seguro: galeria é vitrine, não dado de negócio. */
  removeGalleryItem: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .delete(schema.galleryItems)
        .where(eq(schema.galleryItems.id, input.id));
      return { ok: true as const };
    }),

  reorderGallery: base
    .input(auth.extend({ ids: z.array(z.number().int().positive()).min(1) }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await Promise.all(
        input.ids.map((id, index) =>
          db
            .update(schema.galleryItems)
            .set({ sortOrder: index + 1 })
            .where(eq(schema.galleryItems.id, id)),
        ),
      );
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Depoimentos
   * ---------------------------------------------------------------- */

  testimonials: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.testimonials)
      .orderBy(asc(schema.testimonials.sortOrder));
  }),

  addTestimonial: base
    .input(
      auth.extend({
        name: z.string().min(2).max(80),
        role: z.string().min(2).max(80),
        quote: z.string().min(10).max(600),
        rating: z.number().int().min(1).max(5).default(5),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const rows = await db.select().from(schema.testimonials);
      const maior = rows.reduce((max, row) => Math.max(max, row.sortOrder), 0);
      const initials = input.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
      const [row] = await db
        .insert(schema.testimonials)
        .values({
          name: input.name,
          role: input.role,
          quote: input.quote,
          rating: input.rating,
          initials: initials || "CM",
          sortOrder: maior + 1,
        })
        .returning();
      return { ok: true as const, id: row.id };
    }),

  updateTestimonial: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        name: z.string().min(2).max(80).optional(),
        role: z.string().min(2).max(80).optional(),
        quote: z.string().min(10).max(600).optional(),
        rating: z.number().int().min(1).max(5).optional(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _pw, id, ...campos } = input;
      const patch = Object.fromEntries(
        Object.entries(campos).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(patch).length === 0) return { ok: true as const };
      await db
        .update(schema.testimonials)
        .set(patch)
        .where(eq(schema.testimonials.id, id));
      return { ok: true as const };
    }),

  removeTestimonial: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .delete(schema.testimonials)
        .where(eq(schema.testimonials.id, input.id));
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Tabela de preços (varejo + atacado)
   *
   * Isto alimenta o site, os orçamentos e o atendente de IA ao mesmo
   * tempo. Mudar aqui muda em todos — de propósito, para nunca divergir.
   * ---------------------------------------------------------------- */

  priceModels: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    const models = await loadPriceModels();
    const overrides = await db.select().from(schema.priceOverrides);
    const editados = new Set(overrides.map((row) => row.modelKey));
    return models.map((model) => ({
      ...model,
      editado: editados.has(model.key),
    }));
  }),

  savePriceModel: base
    .input(
      auth.extend({
        modelKey: z.string().min(2).max(60),
        retailFrom: z.number().positive().max(100000),
        retailTo: z.number().positive().max(100000),
        tiers: z
          .array(
            z.object({
              min: z.number().int().min(1),
              max: z.number().int().min(1),
              unit: z.number().positive().max(100000),
              label: z.string().min(1).max(60),
            }),
          )
          .min(1)
          .max(12),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);

      if (input.retailTo < input.retailFrom) {
        throw new ORPCError("BAD_REQUEST", {
          message: "O preço final do varejo não pode ser menor que o inicial.",
        });
      }
      for (const tier of input.tiers) {
        if (tier.max < tier.min) {
          throw new ORPCError("BAD_REQUEST", {
            message: `A faixa "${tier.label}" tem quantidade final menor que a inicial.`,
          });
        }
      }

      const values = {
        modelKey: input.modelKey,
        retailFrom: input.retailFrom,
        retailTo: input.retailTo,
        tiersJson: JSON.stringify(input.tiers),
        updatedAt: new Date(),
      };

      await db
        .insert(schema.priceOverrides)
        .values(values)
        .onConflictDoUpdate({
          target: schema.priceOverrides.modelKey,
          set: values,
        });

      return { ok: true as const };
    }),

  /** Volta um modelo para o preço original do código. */
  resetPriceModel: base
    .input(auth.extend({ modelKey: z.string().min(2).max(60) }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .delete(schema.priceOverrides)
        .where(eq(schema.priceOverrides.modelKey, input.modelKey));
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Faixa sazonal
   * ---------------------------------------------------------------- */

  banners: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return db
      .select()
      .from(schema.seasonalBanners)
      .orderBy(desc(schema.seasonalBanners.startsOn));
  }),

  saveBanner: base
    .input(
      auth.extend({
        id: z.number().int().positive().optional(),
        title: z.string().min(3).max(120),
        subtitle: z.string().max(200).nullable().optional(),
        ctaLabel: z.string().max(40).nullable().optional(),
        ctaHref: z.string().max(200).nullable().optional(),
        emoji: z.string().max(8).nullable().optional(),
        accent: z.enum(["magenta", "blue", "yellow", "mint", "navy"]),
        startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        active: z.boolean().default(true),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      if (input.endsOn < input.startsOn) {
        throw new ORPCError("BAD_REQUEST", {
          message: "A data de fim não pode ser antes da data de início.",
        });
      }
      const { password: _pw, id, ...campos } = input;
      if (id) {
        await db
          .update(schema.seasonalBanners)
          .set(campos)
          .where(eq(schema.seasonalBanners.id, id));
        return { ok: true as const, id };
      }
      const [row] = await db
        .insert(schema.seasonalBanners)
        .values(campos)
        .returning();
      return { ok: true as const, id: row.id };
    }),

  removeBanner: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .delete(schema.seasonalBanners)
        .where(eq(schema.seasonalBanners.id, input.id));
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Modelos prontos (/prontos)
   *
   * Aqui aparece tudo, inclusive o que é interno: a arte digital para
   * estampar e a observação que só a equipe vê. A rota pública em
   * routes/ready.ts nunca devolve esses dois campos.
   * ---------------------------------------------------------------- */

  readyDesigns: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    const [rows, tipos] = await Promise.all([
      db
        .select()
        .from(schema.readyDesigns)
        .orderBy(asc(schema.readyDesigns.sortOrder)),
      readyTypes(),
    ]);

    return {
      /** Tipos com preço de varejo — alimenta o "preço automático" do form. */
      tipos,
      itens: rows.map((row) => ({
        ...row,
        images: parseJsonList(row.imagesJson),
        tags: parseJsonList(row.tagsJson),
        /** Preço que o site mostra hoje, já resolvido. */
        precoFinal:
          row.price ??
          tipos.find((tipo) => tipo.key === row.productType)?.retailFrom ??
          0,
      })),
    };
  }),

  createReadyDesign: base
    .input(auth.extend(readyFields))
    .handler(async ({ input }) => {
      await assertPassword(input.password);

      const nome = input.name.trim();
      const slug = await slugLivreReady(nome);
      const code = input.code?.trim()
        ? input.code.trim().toUpperCase()
        : await proximoCodigo();

      const jaExiste = await db
        .select({ id: schema.readyDesigns.id })
        .from(schema.readyDesigns)
        .where(eq(schema.readyDesigns.code, code))
        .limit(1);
      if (jaExiste.length > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Já existe um modelo com o código ${code}. Escolha outro.`,
        });
      }

      const existentes = await db
        .select({ sortOrder: schema.readyDesigns.sortOrder })
        .from(schema.readyDesigns);
      const maior = existentes.reduce(
        (max, row) => Math.max(max, row.sortOrder),
        0,
      );

      const [row] = await db
        .insert(schema.readyDesigns)
        .values({
          code,
          slug,
          name: nome,
          description: input.description?.trim() ?? "",
          productType: input.productType,
          price: input.price ?? null,
          comparePrice: input.comparePrice ?? null,
          category: input.category.trim().toLowerCase(),
          imagesJson: JSON.stringify(input.images ?? []),
          tagsJson: JSON.stringify(limparTags(input.tags ?? [])),
          featured: input.featured ?? false,
          soldOut: input.soldOut ?? false,
          hidden: input.hidden ?? false,
          internalNote: input.internalNote?.trim() || null,
          artUrl: input.artUrl?.trim() || null,
          artName: input.artName?.trim() || null,
          sortOrder: maior + 1,
        })
        .returning();

      return { ok: true as const, id: row.id, slug: row.slug, code: row.code };
    }),

  updateReadyDesign: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        name: z.string().min(2).max(120).optional(),
        code: z.string().min(2).max(24).optional(),
        description: z.string().max(2000).optional(),
        productType: z.string().min(2).max(60).optional(),
        /** null volta para o preço automático da tabela. */
        price: z.number().positive().max(100000).nullable().optional(),
        comparePrice: z.number().positive().max(100000).nullable().optional(),
        category: z.string().min(2).max(60).optional(),
        images: z.array(z.string().min(1).max(500)).max(8).optional(),
        tags: z.array(z.string().min(1).max(40)).max(20).optional(),
        featured: z.boolean().optional(),
        soldOut: z.boolean().optional(),
        hidden: z.boolean().optional(),
        internalNote: z.string().max(2000).nullable().optional(),
        artUrl: z.string().max(500).nullable().optional(),
        artName: z.string().max(200).nullable().optional(),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _pw, id, images, tags, code, ...campos } = input;

      if (code !== undefined) {
        const novo = code.trim().toUpperCase();
        const conflito = await db
          .select({ id: schema.readyDesigns.id })
          .from(schema.readyDesigns)
          .where(eq(schema.readyDesigns.code, novo))
          .limit(1);
        if (conflito.length > 0 && conflito[0].id !== id) {
          throw new ORPCError("BAD_REQUEST", {
            message: `O código ${novo} já é de outro modelo.`,
          });
        }
      }

      const patch: Record<string, unknown> = Object.fromEntries(
        Object.entries(campos).filter(([, value]) => value !== undefined),
      );
      if (code !== undefined) patch.code = code.trim().toUpperCase();
      if (images !== undefined) patch.imagesJson = JSON.stringify(images);
      if (tags !== undefined) patch.tagsJson = JSON.stringify(limparTags(tags));
      if (typeof patch.category === "string") {
        patch.category = patch.category.trim().toLowerCase();
      }
      if (patch.internalNote === "") patch.internalNote = null;
      if (patch.artUrl === "") patch.artUrl = null;

      if (Object.keys(patch).length === 0) return { ok: true as const };

      await db
        .update(schema.readyDesigns)
        .set(patch)
        .where(eq(schema.readyDesigns.id, id));
      return { ok: true as const };
    }),

  /**
   * Apaga um modelo pronto de vez. Existe porque a vitrine é feita de arte
   * que entra e sai — para tirar do site sem perder o cadastro (e sem perder
   * a arte digital), o caminho é `hidden`.
   */
  removeReadyDesign: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db
        .delete(schema.readyDesigns)
        .where(eq(schema.readyDesigns.id, input.id));
      return { ok: true as const };
    }),

  reorderReadyDesigns: base
    .input(auth.extend({ ids: z.array(z.number().int().positive()).min(1) }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await Promise.all(
        input.ids.map((id, index) =>
          db
            .update(schema.readyDesigns)
            .set({ sortOrder: index + 1 })
            .where(eq(schema.readyDesigns.id, id)),
        ),
      );
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Tipos de caneca (/modelos)
   * ---------------------------------------------------------------- */

  /** Lista completa, inclusive os ocultos, com o preço já resolvido. */
  mugTypes: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    const [rows, models] = await Promise.all([
      db.select().from(schema.mugTypes).orderBy(asc(schema.mugTypes.sortOrder)),
      loadPriceModels(),
    ]);
    return rows.map((row) => ({
      ...serializeMugType(row, models),
      /* O painel precisa do valor cru: o serialize devolve o já resolvido. */
      priceModelKey: row.priceModelKey,
      priceManual: row.priceManual,
      imagePrintedRaw: row.imagePrinted,
      imageBlankRaw: row.imageBlank,
      hidden: row.hidden,
      sortOrder: row.sortOrder,
    }));
  }),

  createMugType: base
    .input(auth.extend(mugTypeFields))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const nome = input.name.trim();
      const slug = await slugLivreMugType(nome);
      const rows = await db
        .select({ sortOrder: schema.mugTypes.sortOrder })
        .from(schema.mugTypes);
      const ultimo = rows.reduce((max, row) => Math.max(max, row.sortOrder), 0);

      const [criado] = await db
        .insert(schema.mugTypes)
        .values({
          slug,
          name: nome,
          subtitle: input.subtitle?.trim() ?? "",
          description: input.description?.trim() ?? "",
          imagePrinted: input.imagePrinted?.trim() ?? "",
          imageBlank: input.imageBlank?.trim() ?? "",
          priceModelKey: input.priceModelKey?.trim() || null,
          priceManual: input.priceManual ?? null,
          quoteOption: input.quoteOption?.trim() || null,
          highlightsJson: JSON.stringify(
            (input.highlights ?? []).map((item) => item.trim()).filter(Boolean),
          ),
          badge: input.badge?.trim() || null,
          featured: input.featured ?? false,
          hidden: input.hidden ?? false,
          sortOrder: ultimo + 1,
        })
        .returning();

      return criado;
    }),

  updateMugType: base
    .input(
      auth.extend({ id: z.number().int().positive(), ...mugTypeFieldsOpcionais }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _senha, id, highlights, ...resto } = input;

      const patch: Record<string, unknown> = {};
      for (const [campo, valor] of Object.entries(resto)) {
        if (valor === undefined) continue;
        if (campo === "priceModelKey" || campo === "quoteOption" || campo === "badge") {
          patch[campo] = typeof valor === "string" && valor.trim() ? valor.trim() : null;
          continue;
        }
        patch[campo] = typeof valor === "string" ? valor.trim() : valor;
      }
      if (highlights !== undefined) {
        patch.highlightsJson = JSON.stringify(
          highlights.map((item) => item.trim()).filter(Boolean),
        );
      }
      if (Object.keys(patch).length === 0) return { ok: true as const };

      await db
        .update(schema.mugTypes)
        .set(patch)
        .where(eq(schema.mugTypes.id, id));
      return { ok: true as const };
    }),

  removeMugType: base
    .input(auth.extend({ id: z.number().int().positive() }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await db.delete(schema.mugTypes).where(eq(schema.mugTypes.id, input.id));
      return { ok: true as const };
    }),

  reorderMugTypes: base
    .input(auth.extend({ ids: z.array(z.number().int().positive()).min(1) }))
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      await Promise.all(
        input.ids.map((id, index) =>
          db
            .update(schema.mugTypes)
            .set({ sortOrder: index + 1 })
            .where(eq(schema.mugTypes.id, id)),
        ),
      );
      return { ok: true as const };
    }),

  /* ---------------------------------------------------------------- *
   * Topo da home (hero)
   * ---------------------------------------------------------------- */

  /** Lê o topo atual junto com o padrão, para o botão "voltar ao original". */
  hero: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return { hero: await lerHero(), padrao: HERO_PADRAO };
  }),

  updateHero: base
    .input(
      auth.extend({
        eyebrow: z.string().max(60),
        titleTop: z.string().min(1).max(40),
        titleBottom: z.string().max(40),
        titleScript: z.string().max(30),
        highlight: z.string().max(120),
        paragraph: z.string().min(1).max(600),
        badges: z.array(z.string().max(60)).max(3),
        image: z.string().min(1).max(500),
        imageAlt: z.string().min(1).max(200),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _senha, ...config } = input;
      return { ok: true as const, hero: await salvarHero(config) };
    }),

  /* ---------------------------------------------------------------- *
   * Popup de novidades e promoções
   * ---------------------------------------------------------------- */

  popup: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return { popup: await lerPopup(), padrao: POPUP_PADRAO };
  }),

  updatePopup: base
    .input(
      auth.extend({
        enabled: z.boolean(),
        eyebrow: z.string().max(60),
        title: z.string().min(1).max(90),
        text: z.string().min(1).max(400),
        image: z.string().max(500),
        imageAlt: z.string().max(200),
        ctaLabel: z.string().min(1).max(40),
        ctaKind: z.enum(["whatsapp", "link"]),
        ctaMessage: z.string().max(300),
        ctaHref: z.string().max(300),
        secondaryLabel: z.string().max(40),
        secondaryHref: z.string().max(300),
        accent: z.enum(["magenta", "blue", "yellow", "mint", "navy"]),
        delaySeconds: z.number().int().min(0).max(120),
        scrollPercent: z.number().int().min(0).max(100),
        repeatDays: z.number().int().min(0).max(365),
        scope: z.enum(["home", "vitrines", "todas"]),
        /* Vazio = sem limite de data. */
        startsOn: z.string().max(10),
        endsOn: z.string().max(10),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _senha, ...config } = input;
      return {
        ok: true as const,
        popup: await salvarPopup({ ...config, version: 1 }),
      };
    }),

  /* ---------------------------------------------------------------- *
   * Nota do Google
   * ---------------------------------------------------------------- */

  avaliacoes: base.input(auth).handler(async ({ input }) => {
    await assertPassword(input.password);
    return { avaliacoes: await lerAvaliacoes(), padrao: AVALIACOES_PADRAO };
  }),

  updateAvaliacoes: base
    .input(
      auth.extend({
        rating: z.number().min(0).max(5),
        reviewCount: z.number().int().min(0).max(100000),
        profileUrl: z.string().max(500),
        invite: z.string().max(300),
        showOnHome: z.boolean(),
        /* Vazio = nunca conferido. */
        checkedOn: z.string().max(10),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const { password: _senha, ...config } = input;
      return { ok: true as const, avaliacoes: await salvarAvaliacoes(config) };
    }),
};
