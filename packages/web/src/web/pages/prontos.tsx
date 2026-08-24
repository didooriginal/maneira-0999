import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Search, ShoppingBasket, SlidersHorizontal, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useProntos, useProntosFacets } from "../queries/prontos";
import { CardPronto } from "../components/pronto-card";
import { gaveta } from "../components/sacola";
import { Skeleton } from "../components/ui/bits";
import { useSacola } from "../lib/sacola";
import { whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

/**
 * Vitrine de modelos prontos: arte que já existe, pronta para estampar.
 * O cliente junta o que gostou na sacola e fecha tudo num WhatsApp só.
 */

const ordens = [
  { value: "destaques", label: "Mais pedidos" },
  { value: "novidades", label: "Novidades" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
] as const;

type Ordem = (typeof ordens)[number]["value"];

/** "dia-das-maes" -> "Dia das maes" (categoria é guardada em minúsculas). */
function titulo(texto: string) {
  const limpo = texto.replace(/-/g, " ");
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

export default function ProntosPage() {
  useSeo({
    title: "Modelos prontos de canecas personalizadas",
    description:
      "Escolha entre modelos de caneca, camisa e azulejo com arte já pronta. Monte sua sacola e feche o pedido no WhatsApp com a Caneca Maneira, no Rio de Janeiro.",
  });
  usePageView("/prontos");

  const search = useSearch();
  const categoriaInicial = useMemo(
    () => new URLSearchParams(search).get("categoria") ?? "todos",
    [search],
  );

  const [category, setCategory] = useState(categoriaInicial);
  const [tag, setTag] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<Ordem>("destaques");

  useEffect(() => setCategory(categoriaInicial), [categoriaInicial]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 280);
    return () => clearTimeout(id);
  }, [term]);

  const facets = useProntosFacets();
  const lista = useProntos({
    category,
    tag: tag ?? undefined,
    search: debounced,
    sort,
  });
  const { pecas } = useSacola();

  const vazioDeVerdade =
    facets.data?.total === 0 && !debounced && category === "todos" && !tag;

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-navy bg-yellow px-5 py-14 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -top-24 right-6 size-60 rounded-full bg-white/40" />
        <div className="relative mx-auto max-w-7xl">
          <span className="tag bg-white">
            <Sparkles className="mr-1 inline size-3.5" strokeWidth={3} />
            Pronta entrega
          </span>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">
            Modelos{" "}
            <span className="script text-magenta text-[1.1em]">prontos</span>
          </h1>
          <p className="mt-3 max-w-2xl text-navy/75">
            Arte já pronta, preço na tela. Escolhe os que você quer, joga na
            sacola e manda pra gente no WhatsApp — a gente confirma e estampa.
            Quer uma arte só sua? Aí é{" "}
            <Link to="/pedido" className="font-bold underline">
              pedido personalizado
            </Link>
            .
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {pecas > 0 ? (
              <button
                type="button"
                onClick={gaveta.abrir}
                className="btn btn-navy"
              >
                <ShoppingBasket className="size-4" />
                Ver minha sacola ({pecas})
              </button>
            ) : null}
            <a
              href={whatsappLink(
                "Oi! Vi os modelos prontos no site e queria ver mais opções.",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              <FaWhatsapp className="size-4" />
              Falar com a gente
            </a>
          </div>
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
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nome, código ou tema..."
              className="field !border-navy/20 pl-10"
              aria-label="Buscar modelo pronto"
            />
          </div>
          <label className="flex items-center gap-2 md:w-64">
            <SlidersHorizontal className="size-4 shrink-0" strokeWidth={2.5} />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Ordem)}
              className="field !border-navy/20"
              aria-label="Ordenar por"
            >
              {ordens.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {facets.data && facets.data.categories.length > 0 ? (
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setCategory("todos")}
              className={cn(
                "shrink-0 rounded-full border-[3px] border-navy px-4 py-2 font-display text-sm font-bold transition",
                category === "todos"
                  ? "bg-navy text-cream"
                  : "bg-white hover:bg-yellow",
              )}
            >
              Todos ({facets.data.total})
            </button>
            {facets.data.categories.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setCategory(item.name)}
                className={cn(
                  "shrink-0 rounded-full border-[3px] border-navy px-4 py-2 font-display text-sm font-bold transition",
                  category === item.name
                    ? "bg-navy text-cream"
                    : "bg-white hover:bg-yellow",
                )}
              >
                {titulo(item.name)} ({item.count})
              </button>
            ))}
          </div>
        ) : null}

        {facets.data && facets.data.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold tracking-wide text-navy/50 uppercase">
              Temas
            </span>
            {facets.data.tags.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setTag(tag === item.name ? null : item.name)}
                className={cn(
                  "rounded-full border-2 border-navy/25 px-3 py-1 text-xs font-bold transition",
                  tag === item.name
                    ? "border-magenta bg-magenta text-white"
                    : "bg-white hover:border-navy",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : null}

        {lista.isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-96" />
            ))}
          </div>
        ) : lista.data && lista.data.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold text-navy/60">
              {lista.data.length}{" "}
              {lista.data.length === 1
                ? "modelo encontrado"
                : "modelos encontrados"}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lista.data.map((design, index) => (
                <CardPronto
                  key={design.id}
                  design={design}
                  index={index}
                  className="reveal"
                />
              ))}
            </div>
          </>
        ) : (
          <div className="sticker mt-8 p-12 text-center">
            <p className="font-display text-2xl">
              {vazioDeVerdade
                ? "A vitrine está sendo montada"
                : "Nada encontrado por aqui"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-navy/65">
              {vazioDeVerdade
                ? "Ainda estamos subindo os modelos prontos. Chama no WhatsApp que a gente manda fotos das artes que já temos."
                : "Tenta outro termo, tira o filtro de tema ou chama no WhatsApp — a gente também faz do zero, com a sua arte."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href={whatsappLink(
                  "Oi! Queria ver os modelos prontos que vocês têm.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <FaWhatsapp className="size-4" />
                Ver modelos no WhatsApp
              </a>
              <Link to="/pedido" className="btn btn-ghost">
                Fazer pedido personalizado
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
