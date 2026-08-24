import { Link, useParams } from "wouter";
import {
  Check,
  ChevronLeft,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useProduct } from "../queries/catalog";
import { ProductCard } from "../components/product-card";
import { Skeleton, Stars } from "../components/ui/bits";
import { whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

const perks = [
  { icon: Palette, text: "Arte criada ou ajustada por nós, sem custo extra" },
  { icon: RefreshCcw, text: "Prova digital antes de produzir" },
  { icon: ShieldCheck, text: "Quebrou no transporte? Refazemos" },
  { icon: Truck, text: "Enviamos para todo o Brasil" },
];

/**
 * Página de um modelo já produzido. Serve como inspiração: não tem preço nem
 * carrinho — o caminho é sempre o formulário de pedido ou o WhatsApp.
 */
export default function ProdutoPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const query = useProduct(slug);
  const product = query.data?.product;
  const related = query.data?.related ?? [];

  useSeo({
    title: product ? `${product.name} — modelo personalizado` : "Modelo",
    description: product
      ? `${product.name}: ${(product.description ?? "").slice(0, 130)}`.trim()
      : "Veja este modelo de personalizado da Caneca Maneira e peça o seu.",
    noindex: !product,
  });

  // Só registra depois que o produto carregou, senão o título ainda é genérico.
  usePageView(product ? `/caneca/${slug}` : "");

  if (query.isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (query.isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <h1 className="text-4xl">Modelo não encontrado</h1>
        <p className="mt-3 text-navy/65">
          Essa página sumiu do balcão. Dá uma olhada nos modelos que já fizemos.
        </p>
        <Link to="/catalogo" className="btn btn-primary mt-7">
          Ver modelos que já fizemos
        </Link>
      </div>
    );
  }

  const waMessage = `Oi! Vi o modelo "${product.name}" no site e quero um parecido.`;

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy/60 transition hover:text-navy"
        >
          <ChevronLeft className="size-4" strokeWidth={3} />
          voltar aos modelos
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <div className="reveal">
          <div className="sticker relative overflow-hidden bg-blue/30 p-0">
            <img
              src={product.image}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
            {product.badge ? (
              <span className="tag absolute top-4 left-4 bg-yellow">
                {product.badge}
              </span>
            ) : null}
          </div>
        </div>

        <div className="reveal">
          <span className="tag bg-mint">Modelo que já fizemos</span>
          <h1 className="mt-4 text-[clamp(1.9rem,4.5vw,3rem)] leading-tight">
            {product.name}
          </h1>

          {/* Estrelas só aparecem quando existe avaliação real cadastrada. */}
          {product.reviewCount > 0 ? (
            <div className="mt-3 flex items-center gap-2">
              <Stars value={product.rating} />
              <span className="text-sm text-navy/55">
                {product.reviewCount} avaliações
              </span>
            </div>
          ) : null}

          <p className="mt-5 text-lg text-navy/75">{product.description}</p>

          {product.highlights.length > 0 ? (
            <ul className="mt-6 space-y-2">
              {product.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-navy/80">
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-magenta"
                    strokeWidth={3}
                  />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {product.colorOptions.length > 0 || product.sizeOptions.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {[...product.colorOptions, ...product.sizeOptions].map((item) => (
                <span key={item} className="tag bg-cream">
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="sticker mt-8 bg-yellow p-6">
            <h2 className="text-xl">Quer um parecido com esse?</h2>
            <p className="mt-1 text-sm text-navy/75">
              A gente refaz esse modelo com a sua foto, o seu nome e as suas
              cores. Sem custo extra pela arte.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to="/pedido/caneca" className="btn btn-navy flex-1">
                Fazer meu pedido
              </Link>
              <a
                href={whatsappLink(waMessage)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary flex-1"
              >
                <FaWhatsapp className="size-5" />
                Chamar no WhatsApp
              </a>
            </div>
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {perks.map((perk) => (
              <li
                key={perk.text}
                className="flex items-start gap-2 text-sm text-navy/70"
              >
                <perk.icon className="mt-0.5 size-4 shrink-0 text-magenta" />
                {perk.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
          <h2 className="text-3xl">Outros modelos parecidos</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
