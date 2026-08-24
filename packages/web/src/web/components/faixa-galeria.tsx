import { Link } from "wouter";
import { useGallery } from "../queries/catalog";
import { Skeleton } from "./ui/bits";

/**
 * Faixa horizontal com fotos reais de trabalhos entregues.
 *
 * Prova social tem que estar onde a pessoa decide — home e /pedido —, não
 * escondida numa aba do menu. Ver tudo é em /catalogo, junto dos modelos.
 */
export function FaixaGaleria({
  titulo,
  subtitulo,
  compacta = false,
}: {
  titulo?: React.ReactNode;
  subtitulo?: string;
  compacta?: boolean;
}) {
  const gallery = useGallery();

  if (!gallery.isLoading && (gallery.data?.length ?? 0) === 0) return null;

  return (
    <section className={compacta ? "py-8" : "pb-20 md:pb-24"}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {titulo ?? (
              <h2 className="font-display text-2xl font-extrabold">
                Trabalhos que já saíram daqui
              </h2>
            )}
            {subtitulo ? (
              <p className="mt-1 text-sm text-navy/65">{subtitulo}</p>
            ) : null}
          </div>
          <Link to="/catalogo" className="btn btn-ghost">
            Ver tudo que já fizemos
          </Link>
        </div>
      </div>

      <div className="no-scrollbar mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:px-8">
        {gallery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={compacta ? "h-48 w-48 shrink-0" : "h-64 w-64 shrink-0"}
              />
            ))
          : gallery.data?.map((item, i) => (
              <figure
                key={item.id}
                className={`sticker sticker-hover shrink-0 snap-start overflow-hidden p-0 ${
                  compacta ? "w-48" : "w-64"
                }`}
                style={{ rotate: i % 2 === 0 ? "-1.5deg" : "1.5deg" }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  /* As primeiras já vêm carregadas: num carrossel horizontal o
                     lazy só dispara ao arrastar, e o cliente veria quadro
                     branco antes da foto entrar. */
                  loading={i < 6 ? "eager" : "lazy"}
                  className="aspect-square w-full border-b-[3px] border-navy object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 p-3">
                  <span className="font-display text-sm font-bold">
                    {item.title}
                  </span>
                  <span className="tag bg-mint">{item.tag}</span>
                </figcaption>
              </figure>
            ))}
      </div>
    </section>
  );
}
