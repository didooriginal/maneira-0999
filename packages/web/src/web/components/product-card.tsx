import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { Stars } from "./ui/bits";
import { cn } from "../lib/utils";

export interface ProductCardData {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  comparePrice: number | null;
  image: string;
  badge: string | null;
  rating: number;
  reviewCount: number;
}

const bgRotation = ["bg-blue/35", "bg-yellow/35", "bg-mint/40", "bg-magenta/25"];

export function ProductCard({
  product,
  index = 0,
  className,
}: {
  product: ProductCardData;
  index?: number;
  className?: string;
}) {
  return (
    <Link
      to={`/caneca/${product.slug}`}
      className={cn(
        "sticker sticker-hover group flex flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden border-b-[3px] border-navy",
          bgRotation[index % bgRotation.length],
        )}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.badge ? (
            <span className="tag bg-yellow">{product.badge}</span>
          ) : null}
        </div>
        <span className="absolute right-3 bottom-3 grid size-9 translate-y-2 place-items-center rounded-full border-[3px] border-navy bg-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" strokeWidth={3} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Estrelas só aparecem quando existe avaliação real cadastrada. */}
        {product.reviewCount > 0 ? (
          <div className="flex items-center gap-2">
            <Stars value={product.rating} />
            <span className="text-xs text-navy/50">({product.reviewCount})</span>
          </div>
        ) : null}
        <h3 className="font-display text-lg leading-tight font-bold">
          {product.name}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm text-navy/65">
          {product.shortDescription}
        </p>
        <span className="tag mt-1 self-start bg-yellow">
          Quero um assim
        </span>
      </div>
    </Link>
  );
}
