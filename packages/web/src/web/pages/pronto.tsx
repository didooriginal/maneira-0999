import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Check,
  ChevronLeft,
  Palette,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { usePronto } from "../queries/prontos";
import { CardPronto } from "../components/pronto-card";
import { gaveta } from "../components/sacola";
import { sacola } from "../lib/sacola";
import { Skeleton } from "../components/ui/bits";
import { formatPrice, installments, whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";
import { cn } from "../lib/utils";

const perks = [
  { icon: Palette, text: "Arte já pronta: chega mais rápido" },
  { icon: RefreshCcw, text: "Dá para trocar o nome na arte, é só pedir" },
  { icon: ShieldCheck, text: "Quebrou no transporte? Refazemos" },
  { icon: Truck, text: "Enviamos para todo o Brasil" },
];

/**
 * Página de um modelo pronto: fotos, preço e o botão que joga na sacola.
 * Diferente de `/caneca/:slug` (inspiração), aqui o preço é firme e o cliente
 * pode juntar vários modelos antes de chamar no WhatsApp.
 */
export default function ProntoPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const query = usePronto(slug);
  const design = query.data?.design;
  const related = query.data?.related ?? [];

  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [adicionado, setAdicionado] = useState(false);
  const [quantidade, setQuantidade] = useState(1);

  // Trocar de modelo sem sair da rota precisa voltar para a primeira foto.
  useEffect(() => {
    setFotoAtiva(0);
    setQuantidade(1);
  }, [slug]);

  useSeo({
    title: design
      ? `${design.name} (${design.code}) — pronto para enviar`
      : "Modelo pronto",
    description: design
      ? `${design.name}: ${design.typeName} por ${formatPrice(design.price)}. ${(design.description ?? "").slice(0, 110)}`.trim()
      : "Escolha um modelo pronto da Caneca Maneira e receba rápido.",
    noindex: !design,
  });

  usePageView(design ? `/prontos/${slug}` : "");

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

  if (query.isError || !design) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <h1 className="text-4xl">Modelo não encontrado</h1>
        <p className="mt-3 text-navy/65">
          Esse modelo saiu da vitrine. Dá uma olhada nos que estão prontos
          agora.
        </p>
        <Link to="/prontos" className="btn btn-primary mt-7">
          Ver modelos prontos
        </Link>
      </div>
    );
  }

  const fotos = design.images.length > 0 ? design.images : [design.image];
  const capa = fotos[Math.min(fotoAtiva, fotos.length - 1)];

  function adicionar() {
    sacola.adicionar(design!.slug, quantidade);
    setAdicionado(true);
    gaveta.abrir();
    window.setTimeout(() => setAdicionado(false), 1800);
  }

  const waMessage = `Oi! Quero o modelo ${design.code} — ${design.name} (${quantidade} ${quantidade === 1 ? "peça" : "peças"}).`;

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
        <Link
          to="/prontos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy/60 transition hover:text-navy"
        >
          <ChevronLeft className="size-4" strokeWidth={3} />
          voltar aos modelos prontos
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[1fr_1fr] lg:py-12">
        <div className="reveal">
          <div className="sticker relative overflow-hidden bg-blue/30 p-0">
            <img
              src={capa}
              alt={design.name}
              className="aspect-square w-full object-cover"
            />
            <span className="tag absolute top-4 left-4 bg-white">
              {design.code}
            </span>
            {design.featured ? (
              <span className="tag absolute top-4 right-4 bg-yellow">
                Mais pedido
              </span>
            ) : null}
            {design.soldOut ? (
              <span className="absolute inset-x-0 bottom-0 bg-navy/85 py-3 text-center font-display font-extrabold text-cream">
                Esgotado por enquanto
              </span>
            ) : null}
          </div>

          {fotos.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {fotos.map((foto, index) => (
                <button
                  key={`${foto}-${index}`}
                  type="button"
                  onClick={() => setFotoAtiva(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={index === fotoAtiva}
                  className={cn(
                    "size-20 overflow-hidden rounded-xl border-[3px] transition",
                    index === fotoAtiva
                      ? "border-magenta"
                      : "border-navy/20 hover:border-navy/50",
                  )}
                >
                  <img
                    src={foto}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="reveal">
          <span className="tag bg-mint">Pronto para enviar</span>
          <h1 className="mt-4 text-[clamp(1.9rem,4.5vw,3rem)] leading-tight">
            {design.name}
          </h1>
          <p className="mt-2 text-sm font-semibold text-navy/55">
            {design.typeName} · {design.category}
          </p>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <strong className="font-display text-4xl font-extrabold">
              {formatPrice(design.price)}
            </strong>
            {design.comparePrice && design.comparePrice > design.price ? (
              <span className="text-lg text-navy/45 line-through">
                {formatPrice(design.comparePrice)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-navy/60">
            ou {installments(design.price)} no cartão
          </p>

          {design.description ? (
            <p className="mt-5 text-lg text-navy/75">{design.description}</p>
          ) : null}

          {design.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {design.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/prontos?tag=${encodeURIComponent(tag)}`}
                  className="tag bg-cream transition hover:bg-yellow"
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="sticker mt-8 bg-yellow p-6">
            {design.soldOut ? (
              <>
                <h2 className="text-xl">Esse acabou por enquanto</h2>
                <p className="mt-1 text-sm text-navy/75">
                  Chama no WhatsApp que a gente avisa quando voltar — ou faz um
                  parecido com a sua arte.
                </p>
                <a
                  href={whatsappLink(
                    `Oi! O modelo ${design.code} — ${design.name} está esgotado. Me avisa quando voltar?`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary mt-5 w-full"
                >
                  <FaWhatsapp className="size-5" />
                  Quero ser avisado
                </a>
              </>
            ) : (
              <>
                <h2 className="text-xl">Quantas você quer?</h2>
                <p className="mt-1 text-sm text-navy/75">
                  Junte quantos modelos quiser na sacola e mande tudo de uma vez
                  no WhatsApp.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-full border-[3px] border-navy bg-white px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setQuantidade((n) => Math.max(1, n - 1))}
                      aria-label="Diminuir quantidade"
                      className="grid size-8 place-items-center rounded-full font-display text-xl font-extrabold transition hover:bg-cream"
                    >
                      –
                    </button>
                    <span
                      className="w-8 text-center font-display text-lg font-extrabold"
                      data-qtd
                    >
                      {quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantidade((n) => Math.min(999, n + 1))}
                      aria-label="Aumentar quantidade"
                      className="grid size-8 place-items-center rounded-full font-display text-xl font-extrabold transition hover:bg-cream"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-display text-lg font-extrabold">
                    {formatPrice(design.price * quantidade)}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={adicionar}
                    data-add-sacola
                    className={cn(
                      "btn flex-1",
                      adicionado ? "btn-navy" : "btn-primary",
                    )}
                  >
                    {adicionado ? (
                      <>
                        <Check className="size-5" strokeWidth={3} />
                        Está na sacola
                      </>
                    ) : (
                      <>
                        <Plus className="size-5" strokeWidth={3} />
                        Adicionar à sacola
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappLink(waMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-navy flex-1"
                  >
                    <FaWhatsapp className="size-5" />
                    Só esse, no WhatsApp
                  </a>
                </div>
              </>
            )}
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

          <p className="mt-6 text-sm text-navy/60">
            Quer esse desenho com outro nome ou outra cor?{" "}
            <Link
              to="/pedido/caneca"
              className="font-semibold text-magenta underline"
            >
              faz um personalizado
            </Link>{" "}
            que a gente ajusta a arte sem cobrar nada a mais.
          </p>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
          <h2 className="text-3xl">Leva junto</h2>
          <p className="mt-1 text-navy/65">
            Outros prontos de {design.category} — cabem no mesmo pedido.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item, index) => (
              <CardPronto key={item.id} design={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
