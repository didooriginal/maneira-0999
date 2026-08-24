import { Link, useLocation } from "wouter";
import { Building2, PartyPopper, ArrowRight } from "lucide-react";

/**
 * Tarja fixa logo abaixo do menu: avisa que a Caneca Maneira também atende
 * empresa, festa e evento em quantidade.
 *
 * Fica no site inteiro porque muita gente cai numa página de modelo pelo
 * Google e nunca chega na home. Some no painel e na própria /empresas, onde
 * seria repetição.
 */
export function FaixaEmpresas() {
  const [location] = useLocation();
  if (location.startsWith("/painel") || location.startsWith("/empresas")) {
    return null;
  }

  return (
    <Link
      to="/empresas"
      aria-label="Empresas, festas e eventos: pedidos em quantidade a partir de 15 peças"
      className="group block border-b-[3px] border-navy bg-navy text-cream"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-5 py-2.5 text-center md:px-8">
        <span className="flex items-center gap-2 font-display text-sm font-extrabold tracking-wide uppercase text-yellow">
          <Building2 className="size-4 shrink-0" strokeWidth={2.5} />
          Empresas, festas e eventos
          <PartyPopper className="size-4 shrink-0" strokeWidth={2.5} />
        </span>

        <span className="hidden text-sm text-cream/85 sm:inline">
          Brinde e lembrancinha em quantidade a partir de 15 peças, com nota
          fiscal
        </span>

        <span className="inline-flex items-center gap-1 rounded-full border-2 border-yellow px-3 py-0.5 text-xs font-bold text-yellow transition-transform group-hover:translate-x-0.5">
          Ver preços de atacado
          <ArrowRight className="size-3.5" strokeWidth={3} />
        </span>
      </div>
    </Link>
  );
}
