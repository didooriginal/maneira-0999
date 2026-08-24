import { useState } from "react";
import { Link } from "wouter";
import { Check, Eye } from "lucide-react";
import { cn } from "../lib/utils";

export interface TipoCardData {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  imagePrinted: string;
  imageBlank: string | null;
  priceLabel: string;
  quoteOption: string | null;
  highlights: string[];
  badge: string | null;
}

/**
 * Card de um tipo de caneca em /modelos.
 *
 * A foto estampada é a padrão — é ela que desperta vontade. A peça crua fica
 * por baixo e aparece no hover (só em quem tem mouse) ou no botão "ver crua",
 * que é o caminho do celular, onde hover não existe.
 */
export function TipoCard({
  tipo,
  index = 0,
  className,
}: {
  tipo: TipoCardData;
  index?: number;
  className?: string;
}) {
  const [crua, setCrua] = useState(false);
  const temCrua = Boolean(tipo.imageBlank);

  const destino = tipo.quoteOption
    ? `/pedido/caneca?tipo=${encodeURIComponent(tipo.quoteOption)}`
    : "/pedido/caneca";

  return (
    <article
      className={cn("sticker group flex flex-col overflow-hidden p-0", className)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-square w-full border-b-[3px] border-navy bg-white">
        <img
          src={tipo.imagePrinted}
          alt={`${tipo.name} personalizada`}
          loading={index < 4 ? "eager" : "lazy"}
          className="absolute inset-0 size-full object-cover"
        />
        {temCrua ? (
          <img
            src={tipo.imageBlank ?? ""}
            alt={`${tipo.name} sem estampa`}
            loading="lazy"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-200",
              /* Hover só em quem tem mouse: no celular quem manda é o botão. */
              "opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
              crua && "opacity-100",
            )}
          />
        ) : null}

        {tipo.badge ? (
          <span className="tag absolute top-3 left-3 bg-yellow">{tipo.badge}</span>
        ) : null}

        {temCrua ? (
          <button
            type="button"
            onClick={() => setCrua((v) => !v)}
            className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full border-[3px] border-navy bg-white px-3 py-1.5 font-display text-xs font-bold shadow-[3px_3px_0_var(--color-navy)]"
          >
            <Eye className="size-3.5" strokeWidth={3} />
            {crua ? "ver estampada" : "ver crua"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-tight font-extrabold">
          {tipo.name}
        </h3>
        {tipo.subtitle ? (
          <p className="mt-1 text-sm text-navy/65">{tipo.subtitle}</p>
        ) : null}

        {tipo.highlights.length > 0 ? (
          <ul className="mt-4 space-y-1.5 text-sm text-navy/75">
            {tipo.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-mint" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex items-end justify-between gap-3 pt-1">
          <p className="font-display text-lg font-extrabold">
            {tipo.priceLabel}
          </p>
        </div>

        <Link to={destino} className="btn btn-primary mt-4 w-full">
          Quero essa
        </Link>
      </div>
    </article>
  );
}
