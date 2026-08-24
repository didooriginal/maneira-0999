import { Link } from "wouter";
import {
  Baby,
  Beer,
  Briefcase,
  Building2,
  Calendar,
  BookOpen,
  Gem,
  Gift,
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
import { useEffect } from "react";
import {
  useAvaliacoes,
  useCategories,
  useGallery,
  useProductLines,
  useHero,
  usePriceTiers,
  useProducts,
  useTestimonials,
} from "../queries/catalog";
import { ProductCard } from "../components/product-card";
import { SectionTitle, Skeleton, Stars, Wave } from "../components/ui/bits";
import { FaixaGaleria } from "../components/faixa-galeria";
import { MIN_B2B, site, whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

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
  "Orçamento na hora pelo WhatsApp",
  "A partir de 1 unidade",
  "Atacado a partir de 15 peças",
  "Brinde corporativo com nota fiscal",
  "Entrega para todo o Brasil",
  "No Rio: motoboy ou retirada a combinar",
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
    text: "No Rio, motoboy por aplicativo ou retirada a combinar. Fora do Rio, envio com rastreio.",
    color: "bg-magenta",
  },
];

/**
 * Textos do topo enquanto a resposta do servidor não chegou. São os mesmos do
 * padrão do banco: o visitante nunca vê um topo em branco.
 */
const HERO_FALLBACK = {
  eyebrow: "Feito no Rio de Janeiro",
  titleTop: "Personalize",
  titleBottom: "do seu",
  titleScript: "jeito",
  highlight: "Vários modelos e cores diferentes",
  paragraph:
    "Caneca, camisa ou azulejo com a sua foto, frase ou logo. Conte o que você quer, receba o orçamento na hora e feche pelo WhatsApp.",
  badges: [
    "Orçamento sem compromisso",
    "Prova digital grátis",
    "Pronto em 3 dias",
  ],
  image: "/images/hero-mugs.jpg",
  imageAlt: "Diversas canecas personalizadas coloridas",
};

function Hero() {
  // Topo editável pelo painel (aba "Topo da home").
  const hero = useHero().data ?? HERO_FALLBACK;
  // Nota do Google do selo: mesma fonte do bloco lá embaixo (aba "Avaliações").
  const nota = useAvaliacoes();
  const rating = nota.data?.rating ?? site.googleRating;
  const reviewCount = nota.data?.reviewCount ?? site.googleReviewCount;

  return (
    <section className="relative overflow-hidden bg-blue">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-yellow/40 blur-[2px]" />
      <div className="pointer-events-none absolute -right-16 bottom-10 size-56 rounded-full bg-mint/50" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pt-14 pb-24 md:px-8 md:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          {hero.eyebrow ? (
            <span className="tag bg-white">
              <Star className="size-3 fill-yellow" strokeWidth={2.5} />
              {hero.eyebrow}
            </span>
          ) : null}

          <h1 className="mt-5 text-[clamp(2.9rem,7vw,5.4rem)]">
            {hero.titleTop}
            {hero.titleBottom || hero.titleScript ? (
              <>
                <br />
                {hero.titleBottom}
                {hero.titleScript ? (
                  <>
                    {hero.titleBottom ? " " : ""}
                    <span className="script text-[1.1em] text-magenta">
                      {hero.titleScript}
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
          </h1>

          {hero.highlight ? (
            <p className="mt-4 inline-block bg-yellow px-3 py-1.5 font-display text-lg font-extrabold uppercase">
              {hero.highlight}
            </p>
          ) : null}

          <p className="mt-5 max-w-lg text-lg text-navy/75">{hero.paragraph}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/pedido" className="btn btn-primary text-lg">
              Fazer meu pedido
            </Link>
            <Link to="/modelos" className="btn btn-ghost text-lg">
              Ver tipos de caneca
            </Link>
            <Link to="/empresas" className="btn btn-navy text-lg">
              <Building2 className="size-5" strokeWidth={2.5} />
              Sou empresa
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold">
            {hero.badges.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="reveal relative" style={{ animationDelay: "120ms" }}>
          <div className="sticker floaty overflow-hidden !rounded-[32px] p-0">
            <img
              src={hero.image}
              alt={hero.imageAlt}
              className="aspect-4/3 w-full object-cover"
            />
          </div>

          <div className="sticker absolute -bottom-6 -left-4 flex items-center gap-3 !rounded-2xl px-4 py-3 md:-left-10">
            <span className="grid size-11 place-items-center rounded-full border-[3px] border-navy bg-magenta">
              <Sparkles className="size-5 text-white" strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-display text-sm leading-none font-extrabold">
                Nota {rating.toFixed(1).replace(".", ",")} no Google
              </p>
              <p className="text-xs text-navy/60">
                em {reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"}
              </p>
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
        title="Inspire-se pelo clima"
        script="do seu pedido"
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
            kicker="Inspiração"
            title="Modelos que"
            script="já fizemos"
          />
          <Link to="/catalogo" className="btn btn-ghost">
            Ver tudo que já fizemos
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
              src="/images/real-caricatura.jpg"
              alt="Caneca branca com caricatura de DJ personalizada, produzida pela Caneca Maneira"
              loading="lazy"
              className="aspect-square w-full border-b-[3px] border-navy object-cover"
            />
            <figcaption className="p-3 font-display text-sm font-bold">
              Caricatura personalizada
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
            <Link to="/pedido/caneca" className="btn btn-ghost">
              Fazer meu pedido
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductLines() {
  const lines = useProductLines();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <SectionTitle
        kicker="O que a gente personaliza"
        title="Escolhe o que você quer"
        script="personalizar"
        align="center"
      />
      <p className="mx-auto mt-4 max-w-2xl text-center text-navy/70">
        Três linhas, um caminho só: você preenche o pedido, vê a estimativa de
        preço na hora e a gente fecha tudo pelo WhatsApp.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {lines.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[30rem]" />
            ))
          : lines.data?.map((line, i) => (
              <div
                key={line.slug}
                className="sticker sticker-hover reveal flex flex-col overflow-hidden p-0"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="relative border-b-[3px] border-navy"
                  style={{ background: line.color }}
                >
                  <img
                    src={line.image}
                    alt={line.name}
                    loading="lazy"
                    className="aspect-4/3 w-full object-cover"
                  />
                  <span className="sticker absolute -bottom-4 left-4 !rounded-xl bg-yellow px-3 py-1.5 font-display text-sm font-extrabold">
                    {line.priceNote}
                  </span>
                  {/* Preço de atacado no próprio card: quem compra em
                      quantidade vê o número sem precisar abrir outra página. */}
                  {line.wholesaleNote ? (
                    <span className="sticker absolute -bottom-4 right-4 !rounded-xl bg-mint px-3 py-1.5 font-display text-xs font-extrabold">
                      {line.wholesaleNote}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-6 pt-8">
                  <div>
                    <h3 className="font-display text-2xl font-extrabold">
                      {line.name}
                    </h3>
                    <p className="mt-1 text-sm text-navy/65">{line.tagline}</p>
                  </div>

                  <ul className="flex flex-1 flex-col gap-2">
                    {line.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-sm text-navy/75">
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-magenta"
                          strokeWidth={2.5}
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/pedido/${line.slug}`}
                    className="btn btn-primary w-full justify-center"
                  >
                    Fazer meu pedido
                  </Link>
                </div>
              </div>
            ))}
      </div>

      <p className="mt-8 text-center text-sm text-navy/70">
        Vai levar em quantidade?{" "}
        <Link to="/empresas" className="font-semibold text-magenta underline">
          Veja a tabela de atacado
        </Link>{" "}
        — a partir de 15 peças o preço por unidade já cai.
      </p>

      <p className="mt-3 text-center text-sm text-navy/60">
        Quer outra coisa — quadro, chaveiro, almofada?{" "}
        <a
          href={whatsappLink(
            "Olá! Quero personalizar um produto que não está no site.",
          )}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-magenta underline"
        >
          Chama no WhatsApp
        </a>{" "}
        que a gente vê o que dá para fazer.
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

/**
 * O bloco de atacado da home lia 4 preços escritos à mão aqui. Bastava o
 * Diego mexer na tabela do painel para o site prometer um valor que a gente
 * não cobra mais. Agora lê a mesma fonte do orçamento e da IA.
 *
 * `modelo` é a caneca de porcelana branca — o exemplo mais pedido.
 */
const brl = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

function Corporate() {
  const tabela = usePriceTiers();
  const modelo = tabela.data?.models.find((item) => item.key === "branca");

  /* Uma linha por faixa de atacado, ignorando a de varejo (1 a 14). */
  const faixas = (modelo?.tiers ?? [])
    .filter((tier) => tier.min >= MIN_B2B)
    .map((tier) => ({
      qty: tier.max >= 10000 ? `${tier.min}+ un.` : `${tier.min} un.`,
      unit: brl(tier.unit),
    }));

  /* Desconto real do maior volume contra o varejo — sem número inventado. */
  const descontoMax =
    modelo && faixas.length
      ? Math.round(
          (1 -
            (modelo.tiers[modelo.tiers.length - 1]?.unit ?? modelo.retailFrom) /
              modelo.retailFrom) *
            100,
        )
      : null;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-24">
      <div className="sticker grain relative overflow-hidden bg-navy !border-navy p-8 text-cream md:p-14">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-blue/25" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-magenta/20" />
        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="tag border-cream/40 bg-transparent text-yellow">
              <Building2 className="size-3.5" strokeWidth={2.5} />
              Para empresas, eventos e revenda
            </span>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] text-cream">
              Comprou em quantidade?
              <br />
              <span className="script text-yellow text-[1.15em]">
                o preço muda de patamar
              </span>
            </h2>
            <p className="mt-4 max-w-lg text-cream/75">
              Brinde corporativo, uniforme, kit de onboarding, feira ou
              formatura: a partir de {MIN_B2B} peças você já paga atacado
              {descontoMax ? ` — e no maior volume o desconto chega a ${descontoMax}%` : ""}.
              Com nota fiscal, prova digital e embalagem individual.
            </p>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "Tabela de preço por volume pública",
                "NF-e e cadastro de fornecedor",
                "Arte adaptada ao seu logo",
                "Entrega no Rio por motoboy ou retirada",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-cream/80"
                >
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-yellow"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/empresas" className="btn btn-primary">
                Ver preços por quantidade
              </Link>
              <a
                href={whatsappLink(
                  "Olá! Quero um orçamento corporativo de brindes personalizados em quantidade.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost bg-cream"
              >
                <FaWhatsapp className="size-4" />
                Falar com o comercial
              </a>
            </div>
          </div>

          <div className="rounded-3xl border-[3px] border-cream/25 p-6">
            <p className="font-display text-sm font-bold tracking-wide text-yellow uppercase">
              Exemplo — caneca porcelana 325ml
            </p>
            {tabela.isLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-xl bg-cream/15"
                  />
                ))}
              </div>
            ) : (
              <dl className="mt-4 divide-y divide-cream/15">
                {faixas.map((row) => (
                  <div
                    key={row.qty}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <dt className="font-display font-bold text-cream/80">
                      {row.qty}
                    </dt>
                    <dd className="font-display text-2xl font-extrabold text-cream">
                      {row.unit}
                      <span className="ml-1 text-xs font-bold text-cream/60">
                        cada
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-4 text-xs text-cream/55">
              Camisa, azulejo, chopp, glitter e mágica também têm faixa de
              atacado — a tabela completa está na página Para empresas.
            </p>
            <Link
              to="/pedido?empresa=1"
              className="btn btn-blue mt-5 w-full justify-center"
            >
              Pedir orçamento para empresa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function GalleryStrip() {
  return (
    <FaixaGaleria
      titulo={
        <SectionTitle
          kicker="Feito por aqui"
          title="Trabalhos que"
          script="já saíram do forno"
        />
      }
    />
  );
}

/**
 * Prova social sem depoimento inventado: enquanto não houver depoimento real
 * cadastrado no banco, a seção mostra a nota verdadeira do Perfil da Empresa
 * no Google — o mesmo número declarado no JSON-LD do index.html.
 */
/**
 * Deixa o JSON-LD do index.html batendo com a nota salva no painel. O valor
 * escrito no HTML serve de primeira leitura para o robô; se o Diego mudar a
 * nota no painel, isso corrige sem precisar mexer no código.
 */
function useRatingNoSchema(rating: number, reviewCount: number) {
  useEffect(() => {
    const tags = document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );

    for (const tag of tags) {
      try {
        const dados = JSON.parse(tag.textContent ?? "");
        const lista = Array.isArray(dados) ? dados : [dados];
        let mexeu = false;

        for (const item of lista) {
          if (item && typeof item === "object" && item.aggregateRating) {
            item.aggregateRating.ratingValue = rating.toFixed(1);
            item.aggregateRating.reviewCount = String(reviewCount);
            mexeu = true;
          }
        }

        if (mexeu) tag.textContent = JSON.stringify(dados);
      } catch {
        // JSON-LD estranho não pode derrubar a home.
      }
    }
  }, [rating, reviewCount]);
}

function GoogleProof() {
  /* Nota, quantidade e link vêm do painel. Enquanto carrega (ou se der ruim),
     usa o número conferido que está no site.ts — nunca fica sem nada. */
  const config = useAvaliacoes();
  const rating = config.data?.rating ?? site.googleRating;
  const reviewCount = config.data?.reviewCount ?? site.googleReviewCount;
  const profileUrl = config.data?.profileUrl ?? site.googleProfileUrl;
  const invite = config.data?.invite;

  useRatingNoSchema(rating, reviewCount);

  return (
    <div className="sticker reveal mx-auto max-w-2xl bg-cream p-8 text-center md:p-10">
      <div className="flex justify-center">
        <Stars value={Math.round(rating)} />
      </div>
      <p className="mt-4 font-display text-4xl font-extrabold text-magenta">
        {rating.toFixed(1).replace(".", ",")} de 5 no Google
      </p>
      <p className="mt-1 text-sm text-navy/70">
        em {reviewCount}{" "}
        {reviewCount === 1 ? "avaliação de cliente real" : "avaliações de clientes reais"}
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm text-navy/75">
        {invite ||
          "A gente prefere mostrar avaliação de verdade a encher a página de elogio inventado. Já pediu com a gente? Deixa a sua — ela aparece aqui."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          Ver no Google
        </a>
        <a
          href={whatsappLink("Oi! Quero fazer uma caneca personalizada.")}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}

function Testimonials() {
  const testimonials = useTestimonials();
  const avaliacoes = useAvaliacoes();
  const items = testimonials.data ?? [];
  const isEmpty = !testimonials.isLoading && items.length === 0;
  /* Sem depoimento cadastrado, a nota do Google é o único social proof — aí
     ela aparece de qualquer jeito. Com depoimentos, o Diego decide. */
  const mostrarNota = isEmpty || avaliacoes.data?.showOnHome !== false;

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

        {isEmpty ? (
          <div className="mt-12">
            <GoogleProof />
          </div>
        ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))
            : items.map((t, i) => (
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
        )}

        {!isEmpty && mostrarNota ? (
          <div className="mt-12">
            <GoogleProof />
          </div>
        ) : null}
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
            Preenche o formulário de pedido em 1 minuto ou manda a ideia
            direto no WhatsApp. A gente responde rapidinho — de verdade.
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
            <Link to="/pedido" className="btn btn-ghost text-lg">
              Fazer meu pedido
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
  useSeo({
    title: "Caneca Maneira — Personalize do seu jeito",
    description:
      "Canecas, camisas e azulejos personalizados com a sua foto, frase ou desenho. Presentes, festas, formaturas e brindes corporativos. Rio de Janeiro, entrega para todo o Brasil.",
  });
  usePageView("/");
  return (
    <>
      <Hero />
      <Marquee />
      <ProductLines />
      <Featured />
      <ArtStudio />
      <HowItWorks />
      <Categories />
      <Corporate />
      <GalleryStrip />
      <Testimonials />
      <FinalCta />
    </>
  );
}

export default Index;
