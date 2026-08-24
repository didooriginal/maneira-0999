import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useActiveBanner } from "../queries/catalog";
import { gaEvent } from "../lib/ga";

const fundo: Record<string, string> = {
  magenta: "bg-magenta text-white",
  blue: "bg-blue text-navy",
  yellow: "bg-yellow text-navy",
  mint: "bg-mint text-navy",
  navy: "bg-navy text-cream",
};

/**
 * Tarja de campanha no topo do site. Quem controla é o painel: título, cor,
 * botão e datas. Fora do período a procedure devolve null e nada é renderizado.
 */
export function FaixaSazonal() {
  const banner = useActiveBanner();
  if (!banner.data) return null;

  const item = banner.data;
  const cor = fundo[item.accent] ?? fundo.magenta;
  const externo = Boolean(item.ctaHref?.startsWith("http"));

  return (
    <div className={`border-b-[3px] border-navy ${cor}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2.5 text-center text-sm font-semibold md:px-8">
        <span>
          {item.emoji ? <span className="mr-1.5">{item.emoji}</span> : null}
          {item.title}
        </span>
        {item.subtitle ? (
          <span className="font-normal opacity-90">{item.subtitle}</span>
        ) : null}
        {item.ctaLabel && item.ctaHref ? (
          externo ? (
            <a
              href={item.ctaHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4"
              onClick={() => gaEvent("clique_faixa_sazonal", { label: item.title })}
            >
              {item.ctaLabel}
              <ArrowRight className="size-3.5" strokeWidth={3} />
            </a>
          ) : (
            <Link
              to={item.ctaHref}
              className="inline-flex items-center gap-1 underline underline-offset-4"
              onClick={() => gaEvent("clique_faixa_sazonal", { label: item.title })}
            >
              {item.ctaLabel}
              <ArrowRight className="size-3.5" strokeWidth={3} />
            </Link>
          )
        ) : null}
      </div>
    </div>
  );
}
