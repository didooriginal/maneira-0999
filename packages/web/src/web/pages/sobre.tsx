import { Link } from "wouter";
import {
  Brush,
  Flame,
  HeartHandshake,
  Instagram,
  Package,
  Recycle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SectionTitle, Wave } from "../components/ui/bits";
import { site, whatsappLink } from "../lib/site";

const numbers = [
  { value: "+12 mil", label: "canecas estampadas" },
  { value: "+800", label: "clientes felizes" },
  { value: "4,9", label: "nota média nas avaliações" },
  { value: "24h", label: "para responder um orçamento" },
];

const values = [
  {
    icon: Brush,
    title: "Arte de verdade",
    text: "Cada peça passa por um olhar humano. Se a arte tiver que ser refeita, a gente refaz — sem cobrar a mais por isso.",
    color: "bg-yellow",
  },
  {
    icon: ShieldCheck,
    title: "Impressão que dura",
    text: "Sublimação em cerâmica AAA, resistente a micro-ondas e lava-louças. Nada de estampa descascando no terceiro café.",
    color: "bg-mint",
  },
  {
    icon: Package,
    title: "Embalagem à prova de tombo",
    text: "Caixa individual com berço de papelão. Se quebrar no caminho, mandamos outra na hora.",
    color: "bg-blue",
  },
  {
    icon: Recycle,
    title: "Menos lixo, mais caneca",
    text: "Trabalhamos com embalagem reciclável e produção sob demanda: só imprimimos o que foi pedido.",
    color: "bg-magenta",
  },
];

const timeline = [
  {
    year: "2019",
    title: "Começou na cozinha de casa",
    text: "Uma prensa de segunda mão, um notebook velho e a primeira encomenda: 12 canecas para o chá de bebê de uma amiga.",
  },
  {
    year: "2021",
    title: "O Instagram estourou",
    text: "Uma caneca de frase viralizou e a fila de pedidos passou de 300 em um mês. Foi quando viramos gente grande.",
  },
  {
    year: "2023",
    title: "Chegaram os eventos",
    text: "Festas, formaturas, casamentos e confraternizações. Hoje as lembrancinhas em quantidade são quase metade do que sai da nossa produção.",
  },
  {
    year: "Hoje",
    title: "Estampando o Brasil inteiro",
    text: "Um estúdio próprio, uma equipe apaixonada por café e a mesma regra de sempre: nenhuma caneca sai sem a gente aprovar.",
  },
];

const steps = [
  { icon: Sparkles, title: "Você manda a ideia", text: "Foto, frase, logo ou só um rascunho no guardanapo." },
  { icon: Brush, title: "A gente desenha", text: "Você recebe a prévia e aprova antes de qualquer coisa ir pra prensa." },
  { icon: Flame, title: "Prensamos a 200°C", text: "Sublimação de alta durabilidade, peça por peça." },
  { icon: HeartHandshake, title: "Chega na sua mão", text: "Embalado com carinho e rastreio no WhatsApp." },
];

export default function SobrePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-magenta pt-16 pb-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div className="reveal">
            <span className="tag bg-cream">Nossa história</span>
            <h1 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)] text-cream">
              A gente transforma ideia em{" "}
              <span className="script text-[1.1em] text-yellow">caneca</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-cream/90">
              A {site.name} nasceu de uma ideia simples: presente bom é aquele
              que a pessoa usa todo dia. E o que a gente usa todo santo dia? A
              caneca do café.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn btn-primary">
                Ver o catálogo
              </Link>
              <a
                className="btn btn-ghost"
                href={site.instagramUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Instagram className="size-4" /> @{site.instagram}
              </a>
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/hero-mugs.png"
              alt="Canecas personalizadas da Caneca Maneira"
              className="sticker floaty w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map((item) => (
            <div key={item.label} className="sticker reveal p-6 text-center">
              <strong className="block font-display text-4xl text-magenta">
                {item.value}
              </strong>
              <span className="mt-1 block text-sm text-navy/70">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionTitle
          kicker="No que a gente acredita"
          title="Quatro coisas que a gente não abre mão"
          script="nunca"
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {values.map((value) => (
            <div
              key={value.title}
              className={`sticker sticker-hover reveal p-6 ${value.color}`}
            >
              <div className="grid size-12 place-items-center rounded-full border-[3px] border-navy bg-cream">
                <value.icon className="size-6" />
              </div>
              <h3 className="mt-4 text-xl">{value.title}</h3>
              <p className="mt-2 text-navy/80">{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mt-10 bg-blue py-20">
        <Wave className="absolute top-0 left-0" fill="#FFF6E3" flip />
        <div className="mx-auto max-w-5xl px-4 pt-10">
          <SectionTitle
            kicker="Linha do tempo"
            title="De 12 canecas para o Brasil"
            script="inteiro"
            align="center"
          />
          <ol className="mt-12 space-y-5">
            {timeline.map((item) => (
              <li
                key={item.year}
                className="sticker reveal flex flex-col gap-4 p-6 sm:flex-row sm:items-start"
              >
                <span className="tag shrink-0 bg-yellow text-sm">
                  {item.year}
                </span>
                <div>
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-1 text-navy/75">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionTitle
          kicker="Como funciona"
          title="Do rascunho ao café"
          script="em 4 passos"
          align="center"
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="sticker reveal relative p-6">
              <span className="absolute -top-4 -left-3 grid size-10 place-items-center rounded-full border-[3px] border-navy bg-yellow font-display text-lg font-bold">
                {index + 1}
              </span>
              <step.icon className="mt-3 size-7 text-magenta" />
              <h3 className="mt-3 text-lg">{step.title}</h3>
              <p className="mt-1 text-sm text-navy/70">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="sticker grain relative overflow-hidden bg-navy p-8 text-center sm:p-14">
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] text-cream">
            Bora criar a sua?{" "}
            <span className="script text-[1.15em] text-yellow">Vem!</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Uma caneca ou mil. Manda a ideia que a gente cuida do resto.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/orcamento" className="btn btn-primary">
              Pedir orçamento
            </Link>
            <a
              className="btn btn-blue"
              href={whatsappLink("Olá! Vi o site da Caneca Maneira e quero criar uma caneca.")}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
