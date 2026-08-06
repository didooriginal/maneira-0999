import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Instagram, Mail, MapPin, Menu, ShoppingBag, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useCart } from "./cart-context";
import { CartDrawer } from "./cart-drawer";
import { site, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";
import { Wave } from "./ui/bits";

const nav = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/galeria", label: "Galeria" },
  { to: "/orcamento", label: "Orçamento" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
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
  const cart = useCart();
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
            onClick={cart.open}
            aria-label="Abrir carrinho"
            className="relative rounded-full border-[3px] border-navy bg-yellow p-2.5 shadow-[3px_3px_0_var(--color-navy)] transition hover:-translate-y-0.5"
          >
            <ShoppingBag className="size-5" strokeWidth={2.5} />
            {cart.count > 0 ? (
              <span className="absolute -top-2 -right-2 grid min-w-6 place-items-center rounded-full border-2 border-navy bg-magenta px-1 text-xs font-bold text-white">
                {cart.count}
              </span>
            ) : null}
          </button>
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
            <a
              href={`mailto:${site.email}`}
              aria-label="E-mail"
              className="grid size-11 place-items-center rounded-full border-[3px] border-cream/30 transition hover:border-yellow hover:text-yellow"
            >
              <Mail className="size-5" strokeWidth={2.5} />
            </a>
          </div>
        </div>

        <div>
          <p className="font-display text-lg font-bold text-yellow">Navegar</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/75">
            {nav.map((item) => (
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
              <Mail className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              {site.email}
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              @{site.instagram}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-yellow" strokeWidth={2.5} />
              {site.address}
              <br />
              {site.city} · {site.hours}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15 px-5 py-5 text-center text-xs text-cream/50 md:px-8">
        © {new Date().getFullYear()} Caneca Maneira. Todos os direitos reservados.
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
      className="fixed right-5 bottom-5 z-[60] grid size-14 place-items-center rounded-full border-[3px] border-navy bg-[#25D366] shadow-[4px_4px_0_var(--color-navy)] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-navy)]"
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
    </div>
  );
}
