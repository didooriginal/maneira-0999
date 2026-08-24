/**
 * Google Analytics 4 (gtag).
 * O script é carregado no index.html apenas no domínio de produção.
 * Aqui só ficam os disparos — se o gtag não existir, tudo vira no-op.
 */

type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    GA_MEASUREMENT_ID?: string;
    ADS_ID?: string;
    ADS_CONVERSION_LABEL?: string;
    dataLayer?: unknown[];
  }
}

function isReady() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/** Sanitiza props: GA4 aceita string/number/boolean nos parâmetros de evento. */
function clean(props?: GtagParams): GtagParams {
  if (!props) return {};
  const out: GtagParams = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export function gaEvent(name: string, props?: GtagParams) {
  if (!isReady()) return;
  window.gtag?.("event", name, clean(props));
}

export function gaPageView(path: string, title?: string) {
  if (!isReady()) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  });
}

/**
 * Conversão do Google Ads.
 *
 * O snippet que o Google manda por e-mail é do tipo "tráfego do site": ele
 * dispara em qualquer visita, o que enche a conta de conversão que não vale
 * nada. Aqui a gente dispara no mesmo lugar do `gerar_lead` — quando a
 * pessoa realmente entra em contato. É o número que serve pra decidir
 * quanto gastar em anúncio.
 *
 * Roda uma vez por sessão e por origem: quem clica no WhatsApp três vezes é
 * um lead, não três.
 */
const conversoesJaEnviadas = new Set<string>();

export function gaAdsConversion(source: string, props?: GtagParams) {
  if (!isReady()) return;
  const label = window.ADS_CONVERSION_LABEL;
  if (!label) return;
  if (conversoesJaEnviadas.has(source)) return;
  conversoesJaEnviadas.add(source);

  window.gtag?.("event", "conversion", {
    send_to: label,
    ...clean(props),
  });
}

/**
 * Conversão: qualquer contato que chega até a gente.
 * `gerar_lead` é o evento que marcamos como conversão no GA4; o mesmo
 * momento avisa o Google Ads.
 */
export function gaLead(source: string, props?: GtagParams) {
  gaEvent("gerar_lead", { lead_source: source, ...clean(props) });
  gaAdsConversion(source, { lead_source: source });
}
