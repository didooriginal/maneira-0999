import { useEffect } from "react";

/**
 * Título, descrição, canonical e robots por página.
 *
 * O site é uma SPA: o `index.html` tem só os valores da home. Sem isso,
 * todas as rotas competem entre si no Google com o mesmo título.
 */

const SUFFIX = "Caneca Maneira";

function setMeta(selector: string, attr: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    const [key, val] = selector.replace(/meta\[|\]/g, "").split("=");
    tag.setAttribute(key, val.replace(/["']/g, ""));
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

interface SeoOptions {
  title: string;
  description: string;
  /** Páginas que não devem ser indexadas (404, painel interno). */
  noindex?: boolean;
}

export function useSeo({ title, description, noindex = false }: SeoOptions) {
  useEffect(() => {
    const full = title.includes(SUFFIX) ? title : `${title} | ${SUFFIX}`;
    document.title = full;

    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", full);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", full);
    setMeta('meta[name="twitter:description"]', "content", description);

    const url = `${window.location.origin}${window.location.pathname}`;
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    setMeta('meta[property="og:url"]', "content", url);

    const robots = document.head.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    );
    if (noindex) {
      setMeta('meta[name="robots"]', "content", "noindex, nofollow");
    } else if (robots) {
      robots.remove();
    }
  }, [title, description, noindex]);
}
