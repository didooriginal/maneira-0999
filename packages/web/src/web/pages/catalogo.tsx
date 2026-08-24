import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Search, SlidersHorizontal, X, Camera } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useCategories, useGallery, useProducts } from "../queries/catalog";
import { ProductCard, type ProductCardData } from "../components/product-card";
import { Skeleton } from "../components/ui/bits";
import { whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

const sortOptions = [
  { value: "relevancia", label: "Mais recentes" },
  { value: "avaliacao", label: "Mais pedidos" },
] as const;

/**
 * Página única de "modelos que já fizemos".
 *
 * Antes isto vivia em duas páginas (/catalogo com produtos e /galeria com
 * fotos) que diziam a mesma coisa para o cliente. Agora é um grid só: produto
 * (tem preço e página de pedido) e foto de trabalho entregue (abre ampliada)
 * lado a lado. /galeria continua existindo como redirecionamento pra cá.
 */
type ItemFoto = {
  kind: "foto";
  id: number;
  image: string;
  title: string;
  tag: string;
};
type ItemProduto = { kind: "produto"; produto: ProductCardData };
type ItemGrid = ItemProduto | ItemFoto;

/** Sem acento e minúsculo, pra comparar "Canecas Mágicas" com "magicas". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Intercala as fotos entre os produtos (uma a cada três) em vez de jogar
 * todas no fim — assim o cliente vê peça real logo na primeira tela, sem
 * precisar rolar até o rodapé.
 */
function intercalar(produtos: ItemProduto[], fotos: ItemFoto[]): ItemGrid[] {
  if (fotos.length === 0) return produtos;
  if (produtos.length === 0) return fotos;
  const saida: ItemGrid[] = [];
  let f = 0;
  produtos.forEach((p, i) => {
    saida.push(p);
    if ((i + 1) % 3 === 0 && f < fotos.length) saida.push(fotos[f++]);
  });
  while (f < fotos.length) saida.push(fotos[f++]);
  return saida;
}

export default function CatalogoPage() {
  useSeo({
    title: "Modelos que já fizemos",
    description:
      "Modelos e fotos reais de canecas, camisas e azulejos personalizados que já produzimos. Use como inspiração e peça a sua do seu jeito.",
  });
  usePageView("/catalogo");
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
  const [ampliada, setAmpliada] = useState<ItemFoto | null>(null);

  useEffect(() => setCategory(initialCategory), [initialCategory]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 280);
    return () => clearTimeout(id);
  }, [term]);

  const categories = useCategories();
  const products = useProducts({ category, search: debounced, sort });
  const gallery = useGallery();

  /**
   * As fotos não passam pelo servidor (não têm categoria nem ordenação), então
   * o filtro delas é feito aqui, imitando o que o cliente espera: se ele
   * escolheu uma categoria, só ficam as fotos com tag parecida; se ele
   * digitou algo, só ficam as que casam no título ou na tag.
   */
  const fotos = useMemo<ItemFoto[]>(() => {
    let lista = (gallery.data ?? []).map((item) => ({
      kind: "foto" as const,
      id: item.id,
      image: item.image,
      title: item.title,
      tag: item.tag,
    }));

    if (category !== "todos") {
      const cat = categories.data?.find((c) => c.slug === category);
      const alvos = [category, cat?.name ?? ""].map(normalizar).filter(Boolean);
      lista = lista.filter((foto) => {
        const tag = normalizar(foto.tag);
        return alvos.some((alvo) => tag.includes(alvo) || alvo.includes(tag));
      });
    }

    if (debounced.trim()) {
      const t = normalizar(debounced);
      lista = lista.filter(
        (foto) =>
          normalizar(foto.title).includes(t) || normalizar(foto.tag).includes(t),
      );
    }

    return lista;
  }, [gallery.data, categories.data, category, debounced]);

  const itens = useMemo(
    () =>
      intercalar(
        (products.data ?? []).map((produto) => ({
          kind: "produto" as const,
          produto,
        })),
        fotos,
      ),
    [products.data, fotos],
  );

  const carregando = products.isLoading || gallery.isLoading;

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-navy bg-blue px-5 py-14 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -top-20 right-10 size-56 rounded-full bg-yellow/35" />
        <div className="relative mx-auto max-w-7xl">
          <span className="tag bg-white">Inspiração</span>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">
            Modelos que já{" "}
            <span className="script text-magenta text-[1.1em]">fizemos</span>
          </h1>
          <p className="mt-3 max-w-xl text-navy/75">
            Modelos e fotos reais de peças que saíram daqui — é uma amostra,
            temos muito mais do que cabe na tela. Achou um parecido com o que
            você quer? Clica nele e faz o pedido, que a gente adapta com a sua
            arte.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pedido/caneca" className="btn btn-navy">
              Fazer meu pedido
            </Link>
            <a
              href={whatsappLink(
                "Oi! Não achei no site o modelo que quero. Podem me ajudar?",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              <FaWhatsapp className="size-4" />
              Não achei o que quero
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
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar modelo..."
              className="field !border-navy/20 pl-10"
              aria-label="Buscar modelo"
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

        {carregando ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : itens.length > 0 ? (
          <>
            <p className="mt-8 text-sm font-semibold text-navy/60">
              {itens.length}{" "}
              {itens.length === 1 ? "modelo encontrado" : "modelos encontrados"}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {itens.map((item, i) =>
                item.kind === "produto" ? (
                  <ProductCard
                    key={`p-${item.produto.id}`}
                    product={item.produto}
                    index={i}
                    className="reveal"
                  />
                ) : (
                  <button
                    key={`f-${item.id}`}
                    type="button"
                    onClick={() => setAmpliada(item)}
                    className="sticker sticker-hover reveal group flex flex-col overflow-hidden p-0 text-left"
                    style={{ animationDelay: `${(i % 8) * 50}ms` }}
                  >
                    <div className="relative aspect-square overflow-hidden border-b-[3px] border-navy bg-mint/40">
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                      />
                      <span className="tag absolute top-3 left-3 flex items-center gap-1 bg-mint">
                        <Camera className="size-3" strokeWidth={3} />
                        Foto real
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-display text-lg leading-tight font-bold">
                        {item.title}
                      </h3>
                      <p className="flex-1 text-sm text-navy/65">
                        Trabalho entregue de {item.tag}. A gente faz igual ou
                        adapta com a sua arte.
                      </p>
                      <span className="tag mt-1 self-start bg-white">
                        Ver foto ampliada
                      </span>
                    </div>
                  </button>
                ),
              )}
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

        <div className="sticker mt-12 flex flex-col items-center gap-4 bg-navy p-8 text-center text-cream md:p-12">
          <h2 className="text-[clamp(1.7rem,3.5vw,2.5rem)] text-cream">
            Sua caneca pode ser a{" "}
            <span className="script text-yellow text-[1.15em]">próxima daqui</span>
          </h2>
          <p className="max-w-lg text-sm text-cream/70">
            Manda a foto, o logo ou só a ideia. A gente desenha, você aprova e a
            gente produz.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pedido" className="btn btn-primary">
              Fazer meu pedido
            </Link>
            <a
              href={whatsappLink(
                "Oi! Vi os modelos no site e quero uma peça assim.",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              <FaWhatsapp className="size-4" />
              Mandar minha ideia
            </a>
          </div>
        </div>
      </section>

      {ampliada ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-5">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAmpliada(null)}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
          />
          <figure className="sticker relative max-h-[85vh] w-full max-w-lg overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setAmpliada(null)}
              aria-label="Fechar"
              className="absolute top-3 right-3 z-10 rounded-full border-[3px] border-navy bg-white p-1.5"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
            <img
              src={ampliada.image}
              alt={ampliada.title}
              className="w-full border-b-[3px] border-navy object-contain"
            />
            <figcaption className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="font-display text-lg font-bold">
                {ampliada.title}
              </span>
              <a
                href={whatsappLink(
                  `Oi! Vi a foto "${ampliada.title}" no site e quero uma peça assim.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <FaWhatsapp className="size-4" />
                Quero uma assim
              </a>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
