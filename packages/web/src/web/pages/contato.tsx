import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  Clock,
  Instagram,
  MapPin,
  Star,
  MessageCircle,
  Plus,
  Truck,
} from "lucide-react";
import { useAvaliacoes, useCreateQuote } from "../queries/catalog";
import { SectionTitle, Spinner, Wave } from "../components/ui/bits";
import { site, whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

interface ContactForm {
  name: string;
  phone: string;
  message: string;
}

const faq = [
  {
    q: "Qual o prazo de produção?",
    a: "Pedidos avulsos saem em 2 a 4 dias úteis. Lotes acima de 50 unidades levam de 5 a 10 dias úteis, dependendo da arte.",
  },
  {
    q: "Tem pedido mínimo?",
    a: "Não. Você pode pedir uma única caneca. Para eventos, festas e formaturas, a partir de 10 unidades temos preços especiais.",
  },
  {
    q: "Posso ver a arte antes de imprimir?",
    a: "Sempre. Enviamos a prévia digital no WhatsApp e só prensamos depois do seu ok.",
  },
  {
    q: "A estampa sai na lava-louças?",
    a: "Não. Usamos sublimação em cerâmica AAA, que resiste a micro-ondas e lava-louças no uso normal do dia a dia.",
  },
  {
    q: "Vocês entregam em todo o Brasil?",
    a: "Sim, enviamos para todo o país pelos Correios e transportadora. No formulário de pedido você calcula o frete pelo seu CEP, ou pode retirar sem custo na nossa loja no Mercado Popular Uruguaiana.",
  },
  {
    q: "E se a caneca chegar quebrada?",
    a: "Manda uma foto no WhatsApp em até 7 dias e reenviamos outra sem custo nenhum.",
  },
];

const channels = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: site.whatsappDisplay,
    hint: "O jeito mais rápido de falar com a gente",
    href: whatsappLink("Olá! Vim pelo site da Caneca Maneira."),
    color: "bg-mint",
  },
  {
    icon: Truck,
    title: "Formulário de pedido",
    value: "Monte seu pedido em 1 minuto",
    hint: "Escolha modelo, quantidade e já veja a estimativa e o frete",
    href: "/pedido",
    color: "bg-yellow",
  },
  {
    icon: Instagram,
    title: "Instagram",
    value: `@${site.instagram}`,
    hint: "Novidades e trabalhos entregues toda semana",
    href: site.instagramUrl,
    color: "bg-blue",
  },
];

export default function ContatoPage() {
  useSeo({
    title: "Contato",
    description:
      "Fale com a Caneca Maneira pelo WhatsApp (21) 97549-8978 ou visite a loja no Mercado Popular Uruguaiana, centro do Rio de Janeiro.",
  });
  usePageView("/contato");
  const createQuote = useCreateQuote();
  // Nota do Google editável no painel (aba "Avaliações").
  const avaliacoes = useAvaliacoes();
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>();

  async function onSubmit(values: ContactForm) {
    await createQuote.mutateAsync({
      name: values.name,
      phone: values.phone,
      clientType: "pessoal",
      quantity: 1,
      mugType: "Contato pelo site",
      hasArt: "tenho-ideia",
      message: values.message,
    });
    setSent(true);
    reset();
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-yellow pt-16 pb-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <span className="tag bg-cream">Fala com a gente</span>
          <h1 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)]">
            Toda caneca começa com uma{" "}
            <span className="script text-magenta text-[1.1em]">conversa</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-navy/80">
            Dúvida sobre prazo, arte, tamanho de lote ou só quer mostrar uma
            ideia? Escolhe o canal que preferir.
          </p>
        </div>
        <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {channels.map((channel) => {
            const internal = channel.href.startsWith("/");
            const Card = (
              <>
                <div className="grid size-12 place-items-center rounded-full border-[3px] border-navy bg-cream">
                  <channel.icon className="size-6" />
                </div>
                <h2 className="mt-4 text-xl">{channel.title}</h2>
                <strong className="mt-1 block font-display text-lg">
                  {channel.value}
                </strong>
                <p className="mt-1 text-sm text-navy/70">{channel.hint}</p>
              </>
            );
            const className = `sticker sticker-hover reveal block p-6 ${channel.color}`;
            return internal ? (
              <Link key={channel.title} to={channel.href} className={className}>
                {Card}
              </Link>
            ) : (
              <a
                key={channel.title}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {Card}
              </a>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="sticker flex items-start gap-3 p-5">
            <MapPin className="size-5 shrink-0 text-magenta" />
            <div>
              <h3 className="text-base">Onde estamos</h3>
              <p className="text-sm text-navy/70">
                {site.address}
                <br />
                Rua José Sombra, 336 — Irajá (produção)
                <br />
                {site.city}
              </p>
            </div>
          </div>
          <div className="sticker flex items-start gap-3 p-5">
            <Clock className="size-5 shrink-0 text-magenta" />
            <div>
              <h3 className="text-base">Atendimento</h3>
              <p className="text-sm text-navy/70">{site.hours}</p>
            </div>
          </div>
          <div className="sticker flex items-start gap-3 p-5">
            <Truck className="size-5 shrink-0 text-magenta" />
            <div>
              <h3 className="text-base">Entregas</h3>
              <p className="text-sm text-navy/70">
                No Rio, motoboy por aplicativo (sai de Irajá) ou retirada em
                mãos no Centro ou em Irajá. Para o resto do Brasil, calcule o
                frete pelo CEP no formulário de pedido.
              </p>
            </div>
          </div>
        </div>

        <a
          href={avaliacoes.data?.profileUrl ?? site.googleProfileUrl}
          target="_blank"
          rel="noreferrer"
          className="sticker mt-5 flex flex-col items-start gap-4 bg-yellow p-5 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Star className="size-5 shrink-0 fill-navy text-navy" />
            <div>
              <h3 className="text-base">
                {(avaliacoes.data?.rating ?? site.googleRating)
                  .toFixed(1)
                  .replace(".", ",")}{" "}
                de 5 no Google
              </h3>
              <p className="text-sm text-navy/75">
                {avaliacoes.data?.reviewCount ?? site.googleReviewCount}{" "}
                avaliações de clientes reais. Se a sua
                caneca chegou bonita, deixa uma estrelinha lá — ajuda demais
                outra pessoa a encontrar a gente.
              </p>
            </div>
          </div>
          <span className="btn btn-navy shrink-0">Avaliar no Google</span>
        </a>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="sticker p-6 sm:p-8">
            <h2 className="text-2xl">Prefere escrever?</h2>
            <p className="mt-1 text-sm text-navy/70">
              Manda sua mensagem que respondemos em até 24 horas úteis.
            </p>

            {sent ? (
              <div className="mt-6 rounded-2xl border-[3px] border-navy bg-mint p-6 text-center">
                <CheckCircle2 className="mx-auto size-8" />
                <h3 className="mt-3 text-xl">Mensagem enviada!</h3>
                <p className="mt-1 text-sm text-navy/75">
                  Já caiu na nossa caixa. Em breve respondemos.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost mt-5"
                  onClick={() => setSent(false)}
                >
                  Enviar outra
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-4"
                noValidate
              >
                <div>
                  <label className="field-label" htmlFor="c-name">
                    Nome
                  </label>
                  <input
                    id="c-name"
                    className="field"
                    placeholder="Seu nome"
                    {...register("name", { required: true, minLength: 3 })}
                  />
                  {errors.name ? (
                    <span className="mt-1 block text-xs font-semibold text-magenta">
                      Informe seu nome.
                    </span>
                  ) : null}
                </div>

                <div>
                  <div>
                    <label className="field-label" htmlFor="c-phone">
                      WhatsApp
                    </label>
                    <input
                      id="c-phone"
                      className="field"
                      placeholder="(11) 90000-0000"
                      {...register("phone", { required: true, minLength: 8 })}
                    />
                    {errors.phone ? (
                      <span className="mt-1 block text-xs font-semibold text-magenta">
                        Telefone inválido.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="c-message">
                    Mensagem
                  </label>
                  <textarea
                    id="c-message"
                    rows={5}
                    className="field resize-y"
                    placeholder="Como podemos ajudar?"
                    {...register("message", { required: true, minLength: 5 })}
                  />
                  {errors.message ? (
                    <span className="mt-1 block text-xs font-semibold text-magenta">
                      Escreva sua mensagem.
                    </span>
                  ) : null}
                </div>

                {createQuote.isError ? (
                  <p className="rounded-2xl border-[3px] border-magenta bg-magenta/10 p-4 text-sm font-semibold text-magenta">
                    Deu ruim no envio. Tenta de novo ou chama no WhatsApp.
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={createQuote.isPending}
                >
                  {createQuote.isPending ? (
                    <>
                      <Spinner /> Enviando...
                    </>
                  ) : (
                    "Enviar mensagem"
                  )}
                </button>
                <p className="text-center text-xs text-navy/60">
                  Precisa de um lote grande?{" "}
                  <Link href="/pedido" className="font-semibold underline">
                    Faça seu pedido
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>

          <div>
            <SectionTitle
              kicker="Perguntas frequentes"
              title="As dúvidas que mais chegam"
              script="por aqui"
            />
            <div className="mt-8 space-y-3">
              {faq.map((item, index) => (
                <div key={item.q} className="sticker overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-lg font-bold"
                    aria-expanded={openFaq === index}
                  >
                    {item.q}
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border-[3px] border-navy bg-yellow transition-transform ${
                        openFaq === index ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <Plus className="size-4" strokeWidth={3} />
                    </span>
                  </button>
                  {openFaq === index ? (
                    <p className="border-t-[3px] border-dashed border-navy/20 px-5 py-4 text-navy/75">
                      {item.a}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
