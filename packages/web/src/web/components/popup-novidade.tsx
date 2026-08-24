import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { usePopup } from "../queries/catalog";
import { whatsappLink } from "../lib/site";
import { gaEvent } from "../lib/ga";
import { cn } from "../lib/utils";

/**
 * Popup de novidade/promoção — conteúdo e regras vêm do painel.
 *
 * Decisões que o painel NÃO muda, porque atrapalhariam a venda:
 * - no computador é um card no centro; no celular é uma faixa que sobe do
 *   rodapé (intersticial que cobre a tela no mobile é penalizado pelo Google
 *   e é o jeito mais rápido de perder a visita);
 * - nunca aparece nas páginas de pedido nem no painel: quem está lá já está
 *   comprando e interromper só atrapalha;
 * - quem fecha fica um tempo sem ver de novo (guardado no navegador).
 */

const CABECALHO: Record<string, string> = {
  magenta: "bg-magenta text-white",
  blue: "bg-blue text-navy",
  yellow: "bg-yellow text-navy",
  mint: "bg-mint text-navy",
  navy: "bg-navy text-cream",
};

/** Onde o popup nunca aparece, não importa o que o painel diga. */
const PROIBIDO = ["/painel", "/pedido", "/orcamento", "/sacola", "/checkout"];

/** Vitrines: páginas de olhar, onde interromper é aceitável. */
const VITRINES = ["/", "/modelos", "/prontos", "/catalogo"];

function permitido(path: string, scope: string) {
  if (PROIBIDO.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  if (scope === "home") return path === "/";
  if (scope === "vitrines") {
    return VITRINES.some((p) => path === p || (p !== "/" && path.startsWith(`${p}/`)));
  }
  return true;
}

/** Chave por versão: promoção nova volta a aparecer para quem fechou a antiga. */
function chave(version: number) {
  return `cm_popup_v${version}`;
}

function fechadoRecentemente(version: number, repeatDays: number) {
  if (repeatDays <= 0) return false;
  try {
    const salvo = window.localStorage.getItem(chave(version));
    if (!salvo) return false;
    const quando = Number(salvo);
    if (!Number.isFinite(quando)) return false;
    return Date.now() - quando < repeatDays * 24 * 60 * 60 * 1000;
  } catch {
    // Navegador com storage bloqueado: melhor mostrar do que quebrar.
    return false;
  }
}

function marcarFechado(version: number) {
  try {
    window.localStorage.setItem(chave(version), String(Date.now()));
  } catch {
    /* sem storage, sem memória — paciência */
  }
}

export function PopupNovidade() {
  const [location] = useLocation();
  const popup = usePopup();
  const [aberto, setAberto] = useState(false);
  const [fechado, setFechado] = useState(false);

  const item = popup.data ?? null;
  const podeAqui = item ? permitido(location, item.scope) : false;

  /* Gatilhos: tempo e rolagem. O que acontecer primeiro abre. */
  useEffect(() => {
    if (!item || !podeAqui || fechado || aberto) return;
    if (fechadoRecentemente(item.version, item.repeatDays)) return;

    let vivo = true;
    const abrir = () => {
      if (!vivo) return;
      vivo = false;
      setAberto(true);
      gaEvent("popup_visto", { titulo: item.title.slice(0, 60) });
    };

    const timer =
      item.delaySeconds > 0
        ? window.setTimeout(abrir, item.delaySeconds * 1000)
        : null;

    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      if ((window.scrollY / total) * 100 >= item.scrollPercent) abrir();
    };

    if (item.scrollPercent > 0) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* Sem nenhum gatilho configurado, abre já — senão nunca apareceria. */
    if (item.delaySeconds === 0 && item.scrollPercent === 0) abrir();

    return () => {
      vivo = false;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [item, podeAqui, fechado, aberto]);

  /* Trocou de página para uma proibida com o popup aberto: fecha sem marcar. */
  useEffect(() => {
    if (aberto && !podeAqui) setAberto(false);
  }, [aberto, podeAqui]);

  useEffect(() => {
    if (!aberto) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar("esc");
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!item || !aberto || !podeAqui) return null;

  function fechar(origem: string) {
    if (!item) return;
    setAberto(false);
    setFechado(true);
    marcarFechado(item.version);
    gaEvent("popup_fechado", { origem, titulo: item.title.slice(0, 60) });
  }

  function registrarClique() {
    if (!item) return;
    marcarFechado(item.version);
    setAberto(false);
    setFechado(true);
    gaEvent("popup_clique", { titulo: item.title.slice(0, 60) });
  }

  const cor = CABECALHO[item.accent] ?? CABECALHO.magenta;
  const externo = item.ctaKind === "link" && item.ctaHref.startsWith("http");

  const botao =
    item.ctaKind === "whatsapp" ? (
      <a
        href={whatsappLink(item.ctaMessage)}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary w-full"
        onClick={registrarClique}
      >
        <FaWhatsapp className="size-5" />
        {item.ctaLabel}
      </a>
    ) : externo ? (
      <a
        href={item.ctaHref}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary w-full"
        onClick={registrarClique}
      >
        {item.ctaLabel}
        <ArrowRight className="size-4" strokeWidth={3} />
      </a>
    ) : (
      <Link
        to={item.ctaHref || "/pedido"}
        className="btn btn-primary w-full"
        onClick={registrarClique}
      >
        {item.ctaLabel}
        <ArrowRight className="size-4" strokeWidth={3} />
      </Link>
    );

  const linkSecundario =
    item.secondaryLabel && item.secondaryHref ? (
      item.secondaryHref.startsWith("http") ? (
        <a
          href={item.secondaryHref}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-sm font-semibold text-navy/65 underline underline-offset-4"
          onClick={registrarClique}
        >
          {item.secondaryLabel}
        </a>
      ) : (
        <Link
          to={item.secondaryHref}
          className="block text-center text-sm font-semibold text-navy/65 underline underline-offset-4"
          onClick={registrarClique}
        >
          {item.secondaryLabel}
        </Link>
      )
    ) : null;

  const conteudo = (
    <>
      {item.image ? (
        <div className="relative hidden aspect-[16/9] w-full border-b-[3px] border-navy bg-cream md:block">
          <img
            src={item.image}
            alt={item.imageAlt || item.title}
            /* contain: a foto costuma ser quadrada e cortar a caneca fica feio */
            className="absolute inset-0 size-full object-contain"
          />
        </div>
      ) : null}

      <div className="p-5 md:p-6">
        {item.eyebrow ? (
          <span className={cn("tag", cor)}>{item.eyebrow}</span>
        ) : null}
        <h2 className="mt-3 font-display text-2xl leading-tight font-extrabold md:text-3xl">
          {item.title}
        </h2>
        <p className="mt-2 text-sm text-navy/75 md:text-base">{item.text}</p>

        <div className="mt-5 space-y-3">
          {botao}
          {linkSecundario}
        </div>
      </div>
    </>
  );

  const botaoFechar = (
    <button
      type="button"
      onClick={() => fechar("botao")}
      aria-label="Fechar aviso"
      className="absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full border-[3px] border-navy bg-white shadow-[3px_3px_0_var(--color-navy)]"
    >
      <X className="size-4" strokeWidth={3.5} />
    </button>
  );

  return (
    <>
      {/* Computador: card no centro, com fundo escurecido. */}
      <div
        className="fixed inset-0 z-[60] hidden items-center justify-center bg-navy/45 p-6 md:flex"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(event) => {
          if (event.target === event.currentTarget) fechar("fundo");
        }}
      >
        <div className="animate-pop relative w-full max-w-md overflow-hidden rounded-3xl border-[3px] border-navy bg-white shadow-[8px_8px_0_var(--color-navy)]">
          {botaoFechar}
          {conteudo}
        </div>
      </div>

      {/* Celular: faixa que sobe do rodapé, sem cobrir a tela. */}
      <div
        className="animate-subir fixed inset-x-0 bottom-0 z-[60] md:hidden"
        role="dialog"
        aria-label={item.title}
      >
        {/* pb extra: o selo do rodapé fica por cima do último link sem isso. */}
        <div className="relative max-h-[70vh] overflow-y-auto rounded-t-3xl border-t-[3px] border-navy bg-white pb-10 shadow-[0_-6px_0_rgba(11,44,94,0.18)]">
          {botaoFechar}
          {conteudo}
        </div>
      </div>
    </>
  );
}
