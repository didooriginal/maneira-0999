import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Popup de novidades e promoções.
 *
 * Igual ao hero: é sempre uma configuração só, então mora como JSON em
 * `settings` em vez de virar tabela. Quem manda no conteúdo, na cor, no
 * momento em que aparece e nas datas é o painel.
 *
 * Regras que NÃO são editáveis (de propósito, para o popup não atrapalhar
 * quem já está comprando):
 * - nunca aparece no /painel;
 * - nunca aparece nas páginas de pedido/checkout;
 * - no celular vira faixa no rodapé, nunca cobre a tela inteira (o Google
 *   penaliza intersticial invasivo em mobile).
 */

const CHAVE = "home_popup";

/** Onde o popup pode aparecer. */
export type PopupEscopo = "home" | "vitrines" | "todas";

export interface PopupConfig {
  /** Liga/desliga geral. */
  enabled: boolean;
  /** Selinho pequeno acima do título. Vazio = não aparece. */
  eyebrow: string;
  title: string;
  text: string;
  /** Foto opcional. Vazio = popup só de texto. */
  image: string;
  imageAlt: string;
  /** Botão principal. */
  ctaLabel: string;
  /**
   * "whatsapp" usa a mensagem de `ctaMessage`; "link" leva para `ctaHref`
   * (caminho interno tipo /pedido ou uma URL completa).
   */
  ctaKind: "whatsapp" | "link";
  ctaMessage: string;
  ctaHref: string;
  /** Link discreto embaixo do botão. Vazio = não aparece. */
  secondaryLabel: string;
  secondaryHref: string;
  /** Cor de fundo do cabeçalho do card. */
  accent: string;
  /** Segundos antes de aparecer. 0 = não usa tempo. */
  delaySeconds: number;
  /** % de rolagem que também dispara. 0 = não usa rolagem. */
  scrollPercent: number;
  /** Dias de silêncio depois que a pessoa fecha. */
  repeatDays: number;
  /** Onde pode aparecer. */
  scope: PopupEscopo;
  /** Período. Vazio nos dois = sempre no ar. Formato YYYY-MM-DD. */
  startsOn: string;
  endsOn: string;
  /**
   * Muda sozinho a cada salvamento. Vai no nome da chave guardada no
   * navegador, então quem fechou a promoção antiga volta a ver a nova.
   */
  version: number;
}

export const CORES_POPUP = ["magenta", "blue", "yellow", "mint", "navy"] as const;

export const POPUP_PADRAO: PopupConfig = {
  enabled: false,
  eyebrow: "A arte é por nossa conta",
  title: "Manda a ideia que a gente desenha",
  text: "Você não precisa chegar com arquivo pronto. Conta o que quer — foto, frase, logo ou personagem — e a gente cria a arte e manda a prova digital antes de imprimir, sem compromisso.",
  image: "/images/arte-caricatura.jpg",
  imageAlt: "Caneca com caricatura criada pela equipe da Caneca Maneira",
  ctaLabel: "Manda sua ideia no WhatsApp",
  ctaKind: "whatsapp",
  ctaMessage:
    "Oi! Vim pelo site e queria uma arte personalizada. Pode me ajudar a criar?",
  ctaHref: "/pedido",
  secondaryLabel: "Sou empresa e quero brindes",
  secondaryHref: "/empresas",
  accent: "magenta",
  delaySeconds: 6,
  scrollPercent: 40,
  repeatDays: 7,
  scope: "vitrines",
  startsOn: "",
  endsOn: "",
  version: 1,
};

/** Data de hoje no fuso de São Paulo (YYYY-MM-DD). */
export function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function texto(valor: unknown, padrao: string, max: number) {
  if (typeof valor !== "string") return padrao;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, max) : "";
}

function inteiro(valor: unknown, padrao: number, min: number, max: number) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return padrao;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Só aceita YYYY-MM-DD; qualquer outra coisa vira "" (= sem limite). */
function data(valor: unknown) {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor.trim())
    ? valor.trim()
    : "";
}

function normalizar(bruto: unknown): PopupConfig {
  const d = (bruto ?? {}) as Record<string, unknown>;
  const escopo = d.scope;

  return {
    enabled: d.enabled === true,
    eyebrow: texto(d.eyebrow, POPUP_PADRAO.eyebrow, 60),
    title: texto(d.title, POPUP_PADRAO.title, 90) || POPUP_PADRAO.title,
    text: texto(d.text, POPUP_PADRAO.text, 400) || POPUP_PADRAO.text,
    image: texto(d.image, "", 500),
    imageAlt: texto(d.imageAlt, "", 200),
    ctaLabel:
      texto(d.ctaLabel, POPUP_PADRAO.ctaLabel, 40) || POPUP_PADRAO.ctaLabel,
    ctaKind: d.ctaKind === "link" ? "link" : "whatsapp",
    ctaMessage:
      texto(d.ctaMessage, POPUP_PADRAO.ctaMessage, 300) ||
      POPUP_PADRAO.ctaMessage,
    ctaHref: texto(d.ctaHref, POPUP_PADRAO.ctaHref, 300) || POPUP_PADRAO.ctaHref,
    secondaryLabel: texto(d.secondaryLabel, "", 40),
    secondaryHref: texto(d.secondaryHref, "", 300),
    accent: CORES_POPUP.includes(d.accent as (typeof CORES_POPUP)[number])
      ? (d.accent as string)
      : POPUP_PADRAO.accent,
    delaySeconds: inteiro(d.delaySeconds, POPUP_PADRAO.delaySeconds, 0, 120),
    scrollPercent: inteiro(d.scrollPercent, POPUP_PADRAO.scrollPercent, 0, 100),
    repeatDays: inteiro(d.repeatDays, POPUP_PADRAO.repeatDays, 0, 365),
    scope:
      escopo === "home" || escopo === "todas" || escopo === "vitrines"
        ? escopo
        : POPUP_PADRAO.scope,
    startsOn: data(d.startsOn),
    endsOn: data(d.endsOn),
    version: inteiro(d.version, 1, 1, 100000),
  };
}

/** Configuração completa — só o painel enxerga isso. */
export async function lerPopup(): Promise<PopupConfig> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, CHAVE))
    .limit(1);

  const salvo = rows[0]?.value;
  if (!salvo) return POPUP_PADRAO;

  try {
    return normalizar(JSON.parse(salvo));
  } catch {
    // JSON estragado não pode derrubar o site: melhor sem popup.
    return { ...POPUP_PADRAO, enabled: false };
  }
}

/**
 * O que o site público recebe: null quando está desligado ou fora do
 * período. Assim promoção vencida some sozinha, sem ninguém lembrar.
 */
export async function lerPopupAtivo() {
  const config = await lerPopup();
  if (!config.enabled) return null;

  const hoje = hojeSP();
  if (config.startsOn && hoje < config.startsOn) return null;
  if (config.endsOn && hoje > config.endsOn) return null;

  return config;
}

export async function salvarPopup(entrada: PopupConfig) {
  const anterior = await lerPopup();
  const limpo = normalizar(entrada);

  /* Se o conteúdo mudou, a versão sobe: quem já tinha fechado o popup antigo
     volta a ver, porque agora é outro recado. Mexer só na cor ou no tempo não
     incomoda ninguém de novo. */
  const mudouConteudo =
    anterior.title !== limpo.title ||
    anterior.text !== limpo.text ||
    anterior.eyebrow !== limpo.eyebrow ||
    anterior.image !== limpo.image ||
    anterior.ctaLabel !== limpo.ctaLabel;

  const config: PopupConfig = {
    ...limpo,
    version: mudouConteudo ? anterior.version + 1 : anterior.version,
  };

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
