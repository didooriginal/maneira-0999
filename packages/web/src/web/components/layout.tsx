import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bike, Instagram, MapPin, Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { gaEvent, gaLead } from "../lib/ga";
import { site, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";
import { ChatLauncher } from "./chat-launcher";
import { FaixaEmpresas } from "./faixa-empresas";
import { FaixaSazonal } from "./faixa-sazonal";
import { PopupNovidade } from "./popup-novidade";
import { BotaoSacola, GavetaSacola } from "./sacola";
import { Wave } from "./ui/bits";

/**
 * Menu principal enxuto: cada item responde uma pergunta diferente.
 * "Tipos de caneca" = que peça existe (e preço). "Modelos prontos" = arte
 * pronta para comprar agora. O que é apoio (modelos já produzidos, fotos)
 * vive no rodapé e dentro das páginas, para não diluir a escolha aqui em cima.
 */
const nav = [
  { to: "/pedido", label: "Fazer meu pedido" },
  { to: "/prontos", label: "Modelos prontos" },
  { to: "/modelos", label: "Tipos de caneca" },
  { to: "/empresas", label: "Para empresas" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

/** Rodapé: o menu inteiro + as páginas de apoio que saíram do topo. */
const navRodape = [
  ...nav,
  { to: "/catalogo", label: "Modelos que já fizemos" },
];

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="Caneca Maneira — página inicial">
      <img
        src="/logo.png"
        alt="Caneca Maneira — Brindes e Personalizados"
        width={447}
        height={231}
        className="h-12 w-auto md:h-14"
      />
    </Link>
  );
}

function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b-[3px] border-navy bg-cream/95 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_4px_0_rgba(11,44,94,0.12)]",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-full px-4 py-2 font-display text-[0.95rem] font-bold transition",
                location === item.to
                  ? "bg-navy text-cream"
                  : "hover:bg-yellow/60",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {location.startsWith("/painel") ? null : <BotaoSacola />}
          <a
            href={whatsappLink("Oi! Vim pelo site e quero uma caneca personalizada.")}
            target="_blank"
            rel="noreferrer"
            className="btn btn-blue hidden !px-4 !py-2 text-sm md:inline-flex"
          >
            <FaWhatsapp className="size-4" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-full border-[3px] border-navy bg-white p-2.5 shadow-[3px_3px_0_var(--color-navy)] lg:hidden"
          >
            {open ? (
              <X className="size-5" strokeWidth={3} />
            ) : (
              <Menu className="size-5" strokeWidth={3} />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t-[3px] border-navy bg-white px-5 py-4 lg:hidden">
          <div className="grid gap-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-2xl border-[3px] border-navy bg-cream px-4 py-3 font-display font-bold"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={whatsappLink("Oi! Vim pelo site e quero uma caneca personalizada.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-blue mt-1 w-full"
            >
              <FaWhatsapp className="size-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative mt-24 bg-navy text-cream">
      <Wave className="absolute -top-[51px] left-0" fill="#0D3E77" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <img
            src="/logo.png"
            alt="Caneca Maneira"
            width={447}
            height={231}
            className="h-14 w-auto rounded-2xl bg-white p-2"
          />
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            {site.tagline}. Canecas personalizadas para presentear, comemorar e
            deixar sua marca na mesa de quem importa.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid size-11 place-items-center rounded-full border-[3px] border-cream/30 transition hover:border-yellow hover:text-yellow"
            >
              <Instagram className="size-5" strokeWidth={2.5} />
            </a>
            <a
              href={whatsappLink("Oi! Vim pelo site da Caneca Maneira.")}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid size-11 place-items-center rounded-full border-[3px] border-cream/30 transition hover:border-yellow hover:text-yellow"
            >
              <FaWhatsapp className="size-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="font-display text-lg font-bold text-yellow">Navegar</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/75">
            {navRodape.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition hover:text-yellow">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-lg font-bold text-yellow">Contato</p>
          <ul className="mt-4 space-y-3 text-sm text-cream/75">
            <li className="flex items-start gap-2">
              <FaWhatsapp className="mt-0.5 size-4 shrink-0 text-yellow" />
              {site.whatsappDisplay}
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              @{site.instagram}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              {site.address}
              <br />
              Rua José Sombra, 336 — Irajá (produção)
              <br />
              {site.city} · {site.hours}
            </li>
            <li className="flex items-start gap-2">
              <Bike className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              No Rio: motoboy por aplicativo ou retirada a combinar
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-cream/15 px-5 py-5 text-center text-xs text-cream/50 sm:flex-row sm:gap-4 md:px-8">
        <span>
          © {new Date().getFullYear()} Caneca Maneira. Todos os direitos
          reservados.
        </span>
        <Link
          to="/privacidade"
          className="underline transition hover:text-cream"
        >
          Política de Privacidade
        </Link>
      </div>
    </footer>
  );
}

function WhatsAppFab() {
  return (
    <a
      href={whatsappLink("Oi! Quero fazer uma caneca personalizada.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      /* bottom-20 (80px) em vez de bottom-5: o selo "Made with Runable" é
         fixo no rodapé com z-index 10000 e cobria os 2/3 de baixo deste
         botão, roubando o clique. O selo é da plataforma e não pode ser
         removido, então o botão sobe pra ficar inteiro clicável. */
      className="fixed right-5 bottom-20 z-[60] grid size-14 place-items-center rounded-full border-[3px] border-navy bg-[#25D366] shadow-[4px_4px_0_var(--color-navy)] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-navy)]"
    >
      <FaWhatsapp className="size-7 text-navy" />
    </a>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  /* Um único listener no documento cobre TODOS os links de WhatsApp do site
     (header, footer, botão flutuante, cards, páginas). Cada clique conta como
     conversão `gerar_lead` no GA4 — é o nosso "checkout", já que o pedido
     fecha na conversa. */
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("https://wa.me/")) return;
      gaEvent("clique_whatsapp", {
        page_path: window.location.pathname,
        label: (anchor.getAttribute("aria-label") || anchor.textContent || "")
          .trim()
          .slice(0, 80),
      });
      gaLead("whatsapp", { page_path: window.location.pathname });
      window.stonks?.event("clique_whatsapp", {
        path: window.location.pathname,
      });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  /* No painel interno some com faixa de campanha, botão flutuante e chat:
     são coisas de visitante e ficavam por cima dos botões de edição. */
  const interno = location.startsWith("/painel");

  return (
    <div className="flex min-h-screen flex-col">
      {interno ? null : <FaixaSazonal />}
      <Header />
      {interno ? null : <FaixaEmpresas />}
      <main className="flex-1">{children}</main>
      <Footer />
      {interno ? null : (
        <>
          <GavetaSacola />
          <WhatsAppFab />
          <ChatLauncher />
          <PopupNovidade />
        </>
      )}
    </div>
  );
}
