import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Topo da home (o "hero"): foto, textos e os três selinhos.
 *
 * Fica guardado como um JSON só na tabela `settings`, porque é sempre uma
 * linha — criar uma tabela para isso seria peso sem motivo. Se o painel nunca
 * mexeu, valem os textos padrão daqui, então o site nunca aparece vazio.
 */

const CHAVE = "home_hero";

export interface HeroConfig {
  /** Selinho pequeno acima do título. Vazio = não aparece. */
  eyebrow: string;
  /** Primeira linha do título grande. */
  titleTop: string;
  /** Segunda linha, antes da palavra em manuscrito. */
  titleBottom: string;
  /** Palavra em destaque manuscrito (rosa). Vazio = só o resto do título. */
  titleScript: string;
  /** Frase na tarja amarela. Vazio = tarja some. */
  highlight: string;
  /** Parágrafo de explicação. */
  paragraph: string;
  /** Os três selinhos com check. Máx. 3 — o que passar disso é cortado. */
  badges: string[];
  /** Foto grande da direita. */
  image: string;
  /** Texto alternativo da foto (acessibilidade e Google). */
  imageAlt: string;
}

export const HERO_PADRAO: HeroConfig = {
  eyebrow: "Feito no Rio de Janeiro",
  titleTop: "Personalize",
  titleBottom: "do seu",
  titleScript: "jeito",
  highlight: "Vários modelos e cores diferentes",
  paragraph:
    "Caneca, camisa ou azulejo com a sua foto, frase ou logo. Conte o que você quer, receba o orçamento na hora e feche pelo WhatsApp.",
  badges: [
    "Orçamento sem compromisso",
    "Prova digital grátis",
    "Pronto em 3 dias",
  ],
  image: "/images/hero-mugs.jpg",
  imageAlt: "Diversas canecas personalizadas coloridas",
};

/** Junta o que veio do banco com o padrão, campo a campo. */
function normalizar(bruto: unknown): HeroConfig {
  const dados = (bruto ?? {}) as Partial<Record<keyof HeroConfig, unknown>>;
  const texto = (campo: keyof HeroConfig) => {
    const valor = dados[campo];
    return typeof valor === "string" ? valor.trim() : null;
  };

  const badges = Array.isArray(dados.badges)
    ? dados.badges
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .slice(0, 3)
    : null;

  return {
    eyebrow: texto("eyebrow") ?? HERO_PADRAO.eyebrow,
    titleTop: texto("titleTop") || HERO_PADRAO.titleTop,
    titleBottom: texto("titleBottom") ?? HERO_PADRAO.titleBottom,
    titleScript: texto("titleScript") ?? HERO_PADRAO.titleScript,
    highlight: texto("highlight") ?? HERO_PADRAO.highlight,
    paragraph: texto("paragraph") || HERO_PADRAO.paragraph,
    badges: badges && badges.length > 0 ? badges : HERO_PADRAO.badges,
    image: texto("image") || HERO_PADRAO.image,
    imageAlt: texto("imageAlt") || HERO_PADRAO.imageAlt,
  };
}

export async function lerHero(): Promise<HeroConfig> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, CHAVE))
    .limit(1);

  const salvo = rows[0]?.value;
  if (!salvo) return HERO_PADRAO;

  try {
    return normalizar(JSON.parse(salvo));
  } catch {
    // JSON estragado no banco não pode derrubar a home.
    return HERO_PADRAO;
  }
}

export async function salvarHero(config: HeroConfig) {
  const limpo = normalizar(config);
  const value = JSON.stringify(limpo);
  const agora = new Date();

  const existe = await db
    .select({ key: schema.settings.key })
    .from(schema.settings)
    .where(eq(schema.settings.key, CHAVE))
    .limit(1);

  if (existe.length === 0) {
    await db.insert(schema.settings).values({ key: CHAVE, value, updatedAt: agora });
  } else {
    await db
      .update(schema.settings)
      .set({ value, updatedAt: agora })
      .where(eq(schema.settings.key, CHAVE));
  }

  return limpo;
}
