import { useMemo, useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useGallery } from "../queries/catalog";
import { Skeleton } from "../components/ui/bits";
import { whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";

export default function GaleriaPage() {
  const gallery = useGallery();
  const [tag, setTag] = useState("todos");
  const [lightbox, setLightbox] = useState<{ image: string; title: string } | null>(
    null,
  );

  const tags = useMemo(() => {
    const unique = new Set((gallery.data ?? []).map((item) => item.tag));
    return ["todos", ...Array.from(unique)];
  }, [gallery.data]);

  const items = useMemo(() => {
    const list = gallery.data ?? [];
    return tag === "todos" ? list : list.filter((item) => item.tag === tag);
  }, [gallery.data, tag]);

  return (
    <>
      <section className="relative overflow-hidden border-b-[3px] border-navy bg-mint px-5 py-14 md:px-8 md:py-16">
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-yellow/40" />
        <div className="relative mx-auto max-w-7xl">
          <span className="tag bg-white">Galeria</span>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4rem)]">
            Trabalhos que já{" "}
            <span className="script text-magenta text-[1.1em]">saíram daqui</span>
          </h1>
          <p className="mt-3 max-w-xl text-navy/75">
            Cada peça foi feita para uma pessoa ou uma marca específica. Se
            gostar de alguma, a gente adapta para a sua ideia.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {tags.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTag(item)}
              className={cn(
                "shrink-0 rounded-full border-[3px] border-navy px-4 py-2 font-display text-sm font-bold capitalize transition",
                tag === item ? "bg-navy text-cream" : "bg-white hover:bg-yellow",
              )}
            >
              {item === "todos" ? "Todos" : item}
            </button>
          ))}
        </div>

        {gallery.isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightbox({ image: item.image, title: item.title })}
                className="sticker sticker-hover reveal overflow-hidden p-0 text-left"
                style={{
                  animationDelay: `${i * 50}ms`,
                  rotate: i % 3 === 1 ? "-1deg" : i % 3 === 2 ? "1deg" : "0deg",
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-square w-full border-b-[3px] border-navy object-cover"
                />
                <span className="flex items-center justify-between gap-2 p-4">
                  <span className="font-display text-base font-bold">
                    {item.title}
                  </span>
                  <span className="tag bg-blue">{item.tag}</span>
                </span>
              </button>
            ))}
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
            <Link to="/orcamento" className="btn btn-primary">
              Pedir orçamento
            </Link>
            <a
              href={whatsappLink("Oi! Vi a galeria do site e quero uma caneca assim.")}
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

      {lightbox ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-5">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setLightbox(null)}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
          />
          <figure className="sticker relative max-h-[85vh] w-full max-w-lg overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Fechar"
              className="absolute top-3 right-3 z-10 rounded-full border-[3px] border-navy bg-white p-1.5"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
            <img
              src={lightbox.image}
              alt={lightbox.title}
              className="w-full border-b-[3px] border-navy object-contain"
            />
            <figcaption className="p-4 font-display text-lg font-bold">
              {lightbox.title}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
