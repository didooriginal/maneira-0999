import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useTiposCaneca } from "../queries/mug-types";
import { TipoCard } from "../components/tipo-card";
import { Skeleton } from "../components/ui/bits";
import { whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

/**
 * /modelos — que tipos de caneca existem e a partir de quanto sai cada um.
 *
 * É a primeira pergunta de quem chega. Arte pronta para comprar agora está em
 * /prontos; fotos de trabalhos entregues, junto dos modelos em /catalogo.
 */
export default function ModelosPage() {
  useSeo({
    title: "Tipos de caneca personalizada e preços",
    description:
      "Veja os tipos de caneca que produzimos — branca, colorida, com colher, com tarja, polímero e de chopp — com o preço a partir de cada modelo.",
  });
  usePageView("/modelos");

  const tipos = useTiposCaneca();

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-navy bg-blue px-5 py-14 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -top-20 right-10 size-56 rounded-full bg-yellow/35" />
        <div className="relative mx-auto max-w-7xl">
          <span className="tag bg-white">Tipos de caneca</span>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">
            Escolha o tipo de{" "}
            <span className="script text-magenta text-[1.1em]">caneca</span>
          </h1>
          <p className="mt-3 max-w-xl text-navy/75">
            Estes são os modelos que a gente produz. A arte é sempre sua — foto,
            frase, logo ou personagem. Escolha a peça, mande a ideia e a gente
            faz a prova digital antes de imprimir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pedido/caneca" className="btn btn-navy">
              Fazer meu pedido
            </Link>
            <Link to="/prontos" className="btn btn-primary">
              <Sparkles className="size-4" />
              Ver artes já prontas
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        {tipos.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[30rem]" />
            ))}
          </div>
        ) : tipos.data && tipos.data.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-navy/60">
              {tipos.data.length}{" "}
              {tipos.data.length === 1
                ? "tipo de caneca disponível"
                : "tipos de caneca disponíveis"}
              . Passe o mouse na foto (ou toque em "ver crua") para ver a peça
              sem estampa.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tipos.data.map((tipo, i) => (
                <TipoCard key={tipo.id} tipo={tipo} index={i} className="reveal" />
              ))}
            </div>
          </>
        ) : (
          <div className="sticker p-12 text-center">
            <p className="font-display text-2xl">
              Estamos atualizando os modelos
            </p>
            <p className="mt-2 text-sm text-navy/65">
              Fala com a gente no WhatsApp que a gente conta na hora o que tem
              disponível.
            </p>
          </div>
        )}

        <div className="sticker mt-12 flex flex-col items-center gap-4 bg-navy p-8 text-center text-cream md:p-12">
          <h2 className="text-[clamp(1.7rem,3.5vw,2.5rem)] text-cream">
            Quer ver{" "}
            <span className="script text-yellow text-[1.15em]">
              como fica pronta
            </span>
            ?
          </h2>
          <p className="max-w-lg text-sm text-cream/70">
            Dá uma olhada nos modelos que já produzimos e nas fotos reais das
            peças que saíram daqui.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/catalogo" className="btn btn-primary">
              Modelos que já fizemos
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={whatsappLink(
                "Oi! Quero saber qual tipo de caneca combina com a minha ideia.",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
            >
              <FaWhatsapp className="size-4" />
              Tirar dúvida
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
