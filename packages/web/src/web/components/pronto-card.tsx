import { useState } from "react";
import { Link } from "wouter";
import { Check, Plus } from "lucide-react";
import { sacola } from "../lib/sacola";
import { formatPrice } from "../lib/site";
import { gaveta } from "./sacola";
import { cn } from "../lib/utils";

export interface ProntoCardData {
  id: number;
  code: string;
  slug: string;
  name: string;
  typeName: string;
  price: number;
  comparePrice: number | null;
  image: string;
  tags: string[];
  featured: boolean;
  soldOut: boolean;
}

const fundos = ["bg-blue/35", "bg-yellow/35", "bg-mint/40", "bg-magenta/25"];

/** Cartão da vitrine: clica na foto para ver, no botão para jogar na sacola. */
export function CardPronto({
  design,
  index = 0,
  className,
}: {
  design: ProntoCardData;
  index?: number;
  className?: string;
}) {
  const [adicionado, setAdicionado] = useState(false);

  function adicionar() {
    sacola.adicionar(design.slug);
    setAdicionado(true);
    gaveta.abrir();
    window.setTimeout(() => setAdicionado(false), 1600);
  }

  return (
    <article
      className={cn("sticker flex flex-col overflow-hidden", className)}
      data-pronto={design.code}
    >
      <Link
        to={`/prontos/${design.slug}`}
        className="group block"
        aria-label={`Ver o modelo ${design.code} — ${design.name}`}
      >
        <div
          className={cn(
            "relative aspect-square overflow-hidden border-b-[3px] border-navy",
            fundos[index % fundos.length],
          )}
        >
          <img
            src={design.image}
            alt={design.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            <span className="tag bg-white">{design.code}</span>
            {design.featured ? (
              <span className="tag bg-yellow">Mais pedido</span>
            ) : null}
          </div>
          {design.soldOut ? (
            <span className="absolute inset-x-0 bottom-0 bg-navy/85 py-2 text-center font-display text-sm font-extrabold text-cream">
              Esgotado por enquanto
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/prontos/${design.slug}`}>
          <h3 className="font-display text-lg leading-tight font-bold">
            {design.name}
          </h3>
        </Link>
        <p className="text-xs text-navy/60">{design.typeName}</p>

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          <strong className="font-display text-2xl font-extrabold">
            {formatPrice(design.price)}
          </strong>
          {design.comparePrice && design.comparePrice > design.price ? (
            <span className="text-sm text-navy/45 line-through">
              {formatPrice(design.comparePrice)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={adicionar}
          disabled={design.soldOut}
          className={cn(
            "btn mt-2 w-full !px-4 !py-2.5 !text-sm",
            adicionado ? "btn-navy" : "btn-primary",
            design.soldOut && "pointer-events-none opacity-45",
          )}
        >
          {design.soldOut ? (
            "Indisponível"
          ) : adicionado ? (
            <>
              <Check className="size-4" strokeWidth={3} />
              Na sacola
            </>
          ) : (
            <>
              <Plus className="size-4" strokeWidth={3} />
              Quero esse
            </>
          )}
        </button>
      </div>
    </article>
  );
}
