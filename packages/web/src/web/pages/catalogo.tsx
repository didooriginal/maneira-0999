import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCategories, useProducts } from "../queries/catalog";
import { ProductCard } from "../components/product-card";
import { Skeleton } from "../components/ui/bits";
import { cn } from "../lib/utils";

const sortOptions = [
  { value: "relevancia", label: "Mais relevantes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "avaliacao", label: "Melhor avaliadas" },
] as const;

export default function CatalogoPage() {
  const search = useSearch();
  const initialCategory = useMemo(
    () => new URLSearchParams(search).get("categoria") ?? "todos",
    [search],
  );

  const [category, setCategory] = useState(initialCategory);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] =
    useState<(typeof sortOptions)[number]["value"]>("relevancia");

  useEffect(() => setCategory(initialCategory), [initialCategory]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 280);
    return () => clearTimeout(id);
  }, [term]);

  const categories = useCategories();
  const products = useProducts({ category, search: debounced, sort });

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-navy bg-blue px-5 py-14 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -top-20 right-10 size-56 rounded-full bg-yellow/35" />
        <div className="relative mx-auto max-w-7xl">
          <span className="tag bg-white">Catálogo</span>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">
            Todas as canecas{" "}
            <span className="script text-magenta text-[1.1em]">maneiras</span>
          </h1>
          <p className="mt-3 max-w-xl text-navy/75">
            Personalização inclusa em todos os modelos. Pediu 1 ou 500, a arte é
            sua.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="sticker flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-navy/45"
              strokeWidth={2.5}
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar caneca..."
              className="field !border-navy/20 pl-10"
              aria-label="Buscar caneca"
            />
          </div>
          <label className="flex items-center gap-2 md:w-64">
            <SlidersHorizontal className="size-4 shrink-0" strokeWidth={2.5} />
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as (typeof sortOptions)[number]["value"])
              }
              className="field !border-navy/20"
              aria-label="Ordenar por"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategory("todos")}
            className={cn(
              "shrink-0 rounded-full border-[3px] border-navy px-4 py-2 font-display text-sm font-bold transition",
              category === "todos" ? "bg-navy text-cream" : "bg-white hover:bg-yellow",
            )}
          >
            Todas
          </button>
          {categories.data?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "shrink-0 rounded-full border-[3px] border-navy px-4 py-2 font-display text-sm font-bold transition",
                category === cat.slug
                  ? "bg-navy text-cream"
                  : "bg-white hover:bg-yellow",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {products.isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : products.data && products.data.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold text-navy/60">
              {products.data.length}{" "}
              {products.data.length === 1 ? "caneca encontrada" : "canecas encontradas"}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.data.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} className="reveal" />
              ))}
            </div>
          </>
        ) : (
          <div className="sticker mt-8 p-12 text-center">
            <p className="font-display text-2xl">Nada encontrado por aqui</p>
            <p className="mt-2 text-sm text-navy/65">
              Tenta outro termo ou fala com a gente no WhatsApp — a gente faz sob
              medida.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
