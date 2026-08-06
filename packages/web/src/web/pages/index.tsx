import { Link } from "wouter";
import {
  Baby,
  Beer,
  Briefcase,
  Calendar,
  BookOpen,
  Frame,
  Gem,
  Gift,
  Grid2x2,
  Shirt,
  Palette,
  Wand2,
  PenTool,
  Sparkles,
  Star,
  Truck,
  Package,
  CheckCircle2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useCategories, useGallery, useProducts, useTestimonials } from "../queries/catalog";
import { ProductCard } from "../components/product-card";
import { SectionTitle, Skeleton, Stars, Wave } from "../components/ui/bits";
import { site, whatsappLink } from "../lib/site";

const categoryIcons: Record<string, typeof Gift> = {
  gift: Gift,
  calendar: Calendar,
  briefcase: Briefcase,
  sparkles: Sparkles,
  palette: Palette,
  beer: Beer,
  baby: Baby,
  wand: Wand2,
  gem: Gem,
};

function isDark(hex: string | null | undefined) {
  const value = (hex ?? "").replace("#", "");
  if (value.length !== 6) return false;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.6;
}

const marqueeWords = [
  "Impressão que não desbota",
  "Prova digital antes de produzir",
  "Frete grátis acima de R$ 199",
  "A partir de 1 unidade",
  "Preços especiais para eventos e festas",
  "Entrega para todo o Brasil",
];

const steps = [
  {
    icon: Palette,
    title: "Escolhe o modelo",
    text: "Clássica, mágica, colorida ou kit. Você decide o tamanho e a cor.",
    color: "bg-yellow",
  },
  {
    icon: PenTool,
    title: "Manda sua arte",
    text: "Foto, logo ou só a ideia — a gente desenha e você aprova antes.",
    color: "bg-blue",
  },
  {
    icon: Package,
    title: "A gente produz",
    text: "Sublimação em cerâmica AAA, conferida peça por peça.",
    color: "bg-mint",
  },
  {
    icon: Truck,
    title: "Chega na sua casa",
    text: "Embalagem reforçada e rastreio. Se quebrar no caminho, refazemos.",
    color: "bg-magenta",
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-blue">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-yellow/40 blur-[2px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-56 rounded-full bg-mint/50" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-14 pb-24 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          <span className="tag bg-white">
            <Star className="size-3 fill-yellow" strokeWidth={2.5} />
            +2.400 canecas entregues
          </span>

          <h1 className="mt-5 text-[clamp(2.9rem,7vw,5.4rem)]">
            Personalize
            <br />
            do seu <span className="script text-[1.1em] text-magenta">jeito</span>
          </h1>

          <p className="mt-4 inline-block bg-yellow px-3 py-1.5 font-display text-lg font-extrabold uppercase">
            Vários modelos e cores diferentes
          </p>

          <p className="mt-5 max-w-lg text-lg text-navy/75">
            Para estampar com as fotos, frases ou desenhos à sua escolha. Da
            unidade única ao pedido de 500 — mesma qualidade, mesmo capricho.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn btn-primary text-lg">
              Ver catálogo
            </Link>
            <Link to="/orcamento" className="btn btn-ghost text-lg">
              Pedir orçamento
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
            {["Frete grátis acima de R$ 199", "Prova digital grátis", "Pronto em 3 dias"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="reveal relative" style={{ animationDelay: "120ms" }}>
          <div className="sticker floaty overflow-hidden !rounded-[32px] p-0">
            <img
              src="/images/hero-mugs.png"
              alt="Diversas canecas personalizadas coloridas"
              className="aspect-4/3 w-full object-cover"
            />
          </div>

          <div className="sticker absolute -bottom-6 -left-4 flex items-center gap-3 !rounded-2xl px-4 py-3 md:-left-10">
            <span className="grid size-11 place-items-center rounded-full border-[3px] border-navy bg-magenta">
              <Sparkles className="size-5 text-white" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-sm leading-none font-extrabold">
                Nota 4,9 / 5
              </p>
              <p className="text-xs text-navy/60">em 800+ avaliações</p>
            </div>
          </div>

          <div className="sticker absolute -top-5 right-2 rotate-3 !rounded-2xl bg-yellow px-4 py-2">
            <p className="script text-xl leading-none">a partir de 1 un.</p>
          </div>
        </div>
      </div>

      <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
    </section>
  );
}

function Marquee() {
  return (
    <div className="overflow-hidden border-y-[3px] border-navy bg-navy py-3">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {marqueeWords.map((word) => (
              <span
                key={`${dup}-${word}`}
                className="flex items-center gap-4 px-6 font-display text-lg font-bold whitespace-nowrap text-yellow"
              >
                {word}
                <Sparkles className="size-4 text-cream" strokeWidth={2.5} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  const categories = useCategories();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <SectionTitle
        kicker="Para cada ocasião"
        title="Escolhe o clima da"
        script="sua caneca"
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))
          : categories.data?.map((cat, i) => {
              const Icon = categoryIcons[cat.emojiIcon ?? "gift"] ?? Gift;
              return (
                <Link
                  key={cat.id}
                  to={`/catalogo?categoria=${cat.slug}`}
                  className="sticker sticker-hover reveal group flex flex-col gap-3 p-6"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span
                    className="grid size-14 place-items-center rounded-2xl border-[3px] border-navy"
                    style={{ background: cat.color }}
                  >
                    <Icon
                      className="size-7"
                      strokeWidth={2.5}
                      style={{ color: isDark(cat.color) ? "#FFF6E3" : "#0D3E77" }}
                    />
                  </span>
                  <h3 className="font-display text-xl font-bold">{cat.name}</h3>
                  <p className="text-sm text-navy/65">{cat.description}</p>
                </Link>
              );
            })}
      </div>
    </section>
  );
}

function Featured() {
  const products = useProducts({ featuredOnly: true });

  return (
    <section className="relative bg-yellow py-20 md:py-24">
      <Wave className="absolute -top-[51px] left-0" fill="#EEDA10" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            kicker="Queridinhas da casa"
            title="As mais"
            script="pedidas"
          />
          <Link to="/catalogo" className="btn btn-ghost">
            Ver todas as canecas
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {products.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))
            : products.data?.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  className="reveal"
                />
              ))}
        </div>
      </div>
      <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
    </section>
  );
}

const artServices = [
  {
    icon: PenTool,
    color: "bg-magenta",
    title: "Caricatura digital",
    text: "Mandou a foto, a gente desenha. Caricatura feita à mão pelo nosso ilustrador, com o traço que combina com a pessoa.",
  },
  {
    icon: BookOpen,
    color: "bg-blue",
    title: "Historinha personalizada",
    text: "A história de vocês em quadrinhos na volta da caneca: o primeiro encontro, a viagem, o apelido bobo. Sai única no mundo.",
  },
  {
    icon: Sparkles,
    color: "bg-yellow",
    title: "Arte criada do zero",
    text: "Não tem arquivo nem ideia fechada? Você conta o que quer e a gente cria a arte completa, com tipografia e cores.",
  },
  {
    icon: CheckCircle2,
    color: "bg-mint",
    title: "Prova digital antes",
    text: "Você aprova o desenho na tela antes de qualquer impressão. Ajuste incluso até ficar do jeito que você imaginou.",
  },
];

function ArtStudio() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
          <figure
            className="sticker reveal overflow-hidden p-0"
            style={{ rotate: "-2deg" }}
          >
            <img
              src="/images/arte-caricatura.jpg"
              alt="Caneca com caricatura de casal desenhada à mão"
              loading="lazy"
              className="aspect-square w-full border-b-[3px] border-navy object-cover"
            />
            <figcaption className="p-3 font-display text-sm font-bold">
              Caricatura de casal
            </figcaption>
          </figure>
          <figure
            className="sticker reveal mt-8 overflow-hidden p-0"
            style={{ rotate: "2deg", animationDelay: "90ms" }}
          >
            <img
              src="/images/arte-historinha.jpg"
              alt="Caneca com historinha personalizada em quadrinhos"
              loading="lazy"
              className="aspect-square w-full border-b-[3px] border-navy object-cover"
            />
            <figcaption className="p-3 font-display text-sm font-bold">
              Historinha em quadrinhos
            </figcaption>
          </figure>
        </div>

        <div className="order-1 lg:order-2">
          <SectionTitle
            kicker="Estúdio de arte próprio"
            title="A arte é nossa e é"
            script="feita com capricho"
          />
          <p className="mt-5 max-w-xl text-navy/70">
            A gente não só imprime: a gente cria. Ilustração, caricatura e
            historinha personalizada saem da nossa mesa de desenho, com traço
            original, cor bem resolvida e acabamento que aguenta o dia a dia.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {artServices.map((item, i) => (
              <div
                key={item.title}
                className="sticker reveal p-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span
                  className={`grid size-12 place-items-center rounded-2xl border-[3px] border-navy ${item.color}`}
                >
                  <item.icon className="size-6" strokeWidth={2.5} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-navy/65">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappLink(
                "Olá! Quero uma arte personalizada (caricatura ou historinha) na caneca.",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              <FaWhatsapp className="size-4" />
              Mandar a foto no WhatsApp
            </a>
            <Link to="/orcamento" className="btn btn-ghost">
              Pedir orçamento de arte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const otherProducts = [
  {
    icon: Shirt,
    color: "bg-magenta",
    title: "Camisas",
    text: "Camiseta personalizada em sublimação ou DTF: time, evento, uniforme, estampa autoral.",
    tag: "Sublimação + DTF",
  },
  {
    icon: Grid2x2,
    color: "bg-blue",
    title: "Azulejos",
    text: "Azulejo decorativo com foto, frase ou arte exclusiva. Vai com suporte ou pronto para a parede.",
    tag: "Sublimação",
  },
  {
    icon: Frame,
    color: "bg-yellow",
    title: "Quadros",
    text: "Quadro sublimado com a sua foto ou ilustração, com acabamento pronto para presentear.",
    tag: "Sublimação",
  },
];

function OtherProducts() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          kicker="Não é só caneca"
          title="Também personalizamos"
          script="muito mais"
        />
        <a
          href={whatsappLink(
            "Olá! Quero saber sobre camisas, azulejos e quadros personalizados.",
          )}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          <FaWhatsapp className="size-4" />
          Consultar preço
        </a>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {otherProducts.map((item, i) => (
          <div
            key={item.title}
            className="sticker sticker-hover reveal flex flex-col gap-3 p-6"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`grid size-14 place-items-center rounded-2xl border-[3px] border-navy ${item.color}`}
              >
                <item.icon className="size-7" strokeWidth={2.5} />
              </span>
              <span className="tag bg-cream">{item.tag}</span>
            </div>
            <h3 className="font-display text-xl font-bold">{item.title}</h3>
            <p className="text-sm text-navy/65">{item.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-2xl text-sm text-navy/60">
        Trabalhamos com sublimação e DTF, então a arte pode ir para tecido,
        cerâmica e MDF com a mesma qualidade de cor. Tem uma ideia diferente?
        Chama no WhatsApp que a gente vê o que dá para fazer.
      </p>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <SectionTitle
        kicker="Simples assim"
        title="Como a gente"
        script="faz acontecer"
        align="center"
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="sticker reveal relative p-6"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className="absolute -top-4 -right-3 grid size-10 place-items-center rounded-full border-[3px] border-navy bg-navy font-display text-lg font-extrabold text-cream">
              {i + 1}
            </span>
            <span
              className={`grid size-14 place-items-center rounded-2xl border-[3px] border-navy ${step.color}`}
            >
              <step.icon className="size-7" strokeWidth={2.5} />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-sm text-navy/65">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Corporate() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-24">
      <div className="sticker grain relative overflow-hidden bg-navy !border-navy p-8 text-cream md:p-14">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-blue/25" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="tag border-cream/40 bg-transparent text-yellow">
              Eventos, festas e formaturas
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] text-cream">
              Faça sua caneca
              <br />
              <span className="script text-yellow text-[1.15em]">com a gente</span>
            </h2>
            <p className="mt-4 max-w-lg text-cream/75">
              Formatura, festa infantil, casamento, evento da empresa ou
              lembrancinha em quantidade: temos preços especiais para você.
              Prova digital antes de produzir, embalagem individual e nota
              fiscal quando precisar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/orcamento" className="btn btn-primary">
                Pedir orçamento
              </Link>
              <a
                href={whatsappLink(
                  "Olá! Quero um orçamento de canecas personalizadas para evento.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                <FaWhatsapp className="size-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {[
              { k: "6 tipos", v: "de caneca para escolher" },
              { k: "10 un.", v: "quantidade mínima para preço especial" },
              { k: "72h", v: "para receber a prova digital" },
              { k: "100%", v: "conferidas antes de embalar" },
            ].map((stat) => (
              <div
                key={stat.k}
                className="rounded-2xl border-[3px] border-cream/25 p-4"
              >
                <dt className="font-display text-2xl font-extrabold text-yellow">
                  {stat.k}
                </dt>
                <dd className="mt-1 text-xs text-cream/65">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function GalleryStrip() {
  const gallery = useGallery();

  return (
    <section className="pb-20 md:pb-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            kicker="Feito por aqui"
            title="Trabalhos que"
            script="já saíram do forno"
          />
          <Link to="/galeria" className="btn btn-ghost">
            Ver galeria completa
          </Link>
        </div>
      </div>

      <div className="no-scrollbar mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:px-8">
        {gallery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-64 shrink-0" />
            ))
          : gallery.data?.map((item, i) => (
              <figure
                key={item.id}
                className="sticker sticker-hover w-64 shrink-0 snap-start overflow-hidden p-0"
                style={{ rotate: i % 2 === 0 ? "-1.5deg" : "1.5deg" }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
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

function Testimonials() {
  const testimonials = useTestimonials();

  return (
    <section className="relative bg-blue py-20 md:py-24">
      <Wave className="absolute -top-[51px] left-0" fill="#7BC7EF" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionTitle
          kicker="Quem já comprou"
          title="Gente feliz com caneca"
          script="na mão"
          align="center"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))
            : testimonials.data?.map((t, i) => (
                <blockquote
                  key={t.id}
                  className="sticker reveal flex flex-col gap-4 p-6"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <Stars value={t.rating} />
                  <p className="flex-1 text-sm leading-relaxed text-navy/80">
                    “{t.quote}”
                  </p>
                  <footer className="flex items-center gap-3">
                    <span
                      className="grid size-11 place-items-center rounded-full border-[3px] border-navy font-display font-extrabold"
                      style={{ background: t.accent }}
                    >
                      {t.initials}
                    </span>
                    <span>
                      <span className="block font-display font-bold">
                        {t.name}
                      </span>
                      <span className="block text-xs text-navy/55">{t.role}</span>
                    </span>
                  </footer>
                </blockquote>
              ))}
        </div>
      </div>
      <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <div className="sticker relative overflow-hidden bg-yellow p-10 text-center md:p-16">
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-52 rounded-full bg-magenta/30" />
        <div className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full bg-blue/40" />
        <div className="relative">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)]">
            Bora fazer a sua{" "}
            <span className="script text-magenta text-[1.15em]">caneca maneira?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-navy/75">
            Manda a ideia no WhatsApp ou preenche o formulário de orçamento. A
            gente responde rapidinho — de verdade.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink("Oi! Quero fazer uma caneca personalizada.")}
              target="_blank"
              rel="noreferrer"
              className="btn btn-navy text-lg"
            >
              <FaWhatsapp className="size-5" />
              Chamar no WhatsApp
            </a>
            <Link to="/catalogo" className="btn btn-ghost text-lg">
              Comprar agora
            </Link>
          </div>
          <p className="mt-6 text-xs font-semibold text-navy/60">
            @{site.instagram} · {site.hours}
          </p>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <Marquee />
      <Categories />
      <Featured />
      <ArtStudio />
      <HowItWorks />
      <Corporate />
      <OtherProducts />
      <GalleryStrip />
      <Testimonials />
      <FinalCta />
    </>
  );
}

export default Index;
