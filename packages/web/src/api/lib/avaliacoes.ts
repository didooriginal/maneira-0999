import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Nota do Google.
 *
 * Antes a nota (5,0) e a quantidade (6) estavam escritas na mão em
 * `web/lib/site.ts`. Toda vez que entrava avaliação nova, o site ficava
 * mentindo até alguém mexer no código. Agora mora em `settings`, no mesmo
 * padrão do hero e do popup, e o Diego atualiza pelo painel.
 *
 * Regra que não é editável: só entra número que dá pra conferir abrindo o
 * perfil do Google. O painel avisa isso na cara do formulário.
 */

const CHAVE = "google_reviews";

export interface AvaliacoesConfig {
  /** Nota média, 0 a 5, uma casa decimal. */
  rating: number;
  /** Quantas avaliações o perfil tem. */
  reviewCount: number;
  /** Link do perfil no Google (usado no botão e no QR do cartaz). */
  profileUrl: string;
  /**
   * Frase do convite que aparece embaixo da nota. Vazio = usa a padrão.
   */
  invite: string;
  /** Mostra ou esconde o bloco da nota na home. */
  showOnHome: boolean;
  /** Quando o Diego conferiu o número pela última vez (YYYY-MM-DD). */
  checkedOn: string;
}

export const AVALIACOES_PADRAO: AvaliacoesConfig = {
  rating: 5,
  reviewCount: 6,
  profileUrl: "https://share.google/5xxKQ4pB60SRuqDkh",
  invite:
    "A gente prefere mostrar avaliação de verdade a encher a página de elogio inventado. Já pediu com a gente? Deixa a sua — ela aparece aqui.",
  showOnHome: true,
  checkedOn: "",
};

function texto(valor: unknown, padrao: string, max: number) {
  if (typeof valor !== "string") return padrao;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, max) : "";
}

/** Nota com uma casa decimal, presa entre 0 e 5. */
function nota(valor: unknown) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return AVALIACOES_PADRAO.rating;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}

function inteiro(valor: unknown, padrao: number, max: number) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(0, Math.round(n)));
}

function data(valor: unknown) {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor.trim())
    ? valor.trim()
    : "";
}

/** Só aceita link http(s) — o QR do cartaz não pode virar lixo. */
function link(valor: unknown) {
  const bruto = texto(valor, "", 500);
  if (!bruto) return "";
  return /^https?:\/\//i.test(bruto) ? bruto : "";
}

function normalizar(bruto: unknown): AvaliacoesConfig {
  const d = (bruto ?? {}) as Record<string, unknown>;

  return {
    rating: nota(d.rating),
    reviewCount: inteiro(d.reviewCount, AVALIACOES_PADRAO.reviewCount, 100000),
    profileUrl: link(d.profileUrl) || AVALIACOES_PADRAO.profileUrl,
    invite: texto(d.invite, AVALIACOES_PADRAO.invite, 300) || AVALIACOES_PADRAO.invite,
    showOnHome: d.showOnHome !== false,
    checkedOn: data(d.checkedOn),
  };
}

export async function lerAvaliacoes(): Promise<AvaliacoesConfig> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, CHAVE))
    .limit(1);

  const salvo = rows[0]?.value;
  if (!salvo) return AVALIACOES_PADRAO;

  try {
    return normalizar(JSON.parse(salvo));
  } catch {
    // JSON estragado não derruba a home: cai no número conferido.
    return AVALIACOES_PADRAO;
  }
}

export async function salvarAvaliacoes(entrada: AvaliacoesConfig) {
  const config = normalizar(entrada);
  const value = JSON.stringify(config);
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

  return config;
}
