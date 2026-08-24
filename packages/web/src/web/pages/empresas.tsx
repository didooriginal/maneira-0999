import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BadgePercent,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  Megaphone,
  Package,
  PenTool,
  Shirt,
  Truck,
  Users,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useModelEstimate, usePriceTiers } from "../queries/catalog";
import { SectionTitle, Skeleton, Spinner, Wave } from "../components/ui/bits";
import { MIN_B2B, formatPrice, site, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";


const quickQuantities = [15, 30, 50, 100, 300, 500];

const segments = [
  {
    icon: Handshake,
    color: "bg-blue",
    title: "Brinde corporativo",
    text: "Caneca com o logo da empresa para clientes, parceiros e fim de ano. Embalada uma a uma, pronta para entregar.",
  },
  {
    icon: Shirt,
    color: "bg-magenta",
    title: "Uniforme e equipe",
    text: "Camisas em sublimação para time interno, loja, feira ou evento — com nome e função de cada pessoa se precisar.",
  },
  {
    icon: Users,
    color: "bg-yellow",
    title: "Onboarding e endomarketing",
    text: "Kit de boas-vindas para quem entra no time: caneca, camisa e azulejo com a identidade da casa.",
  },
  {
    icon: Megaphone,
    color: "bg-mint",
    title: "Feira, evento e campanha",
    text: "Brinde de estande, sorteio e ação de marketing. A gente segura volume e prazo curto quando o evento aperta.",
  },
  {
    icon: CalendarDays,
    color: "bg-blue",
    title: "Formatura e turma",
    text: "Lembrança para a turma inteira com arte exclusiva, numeração e nome de cada formando.",
  },
  {
    icon: Boxes,
    color: "bg-yellow",
    title: "Revenda e presente em lote",
    text: "Você revende, a gente produz. Preço escalonado a partir de 15 peças e reposição combinada.",
  },
];

const perks = [
  {
    icon: BadgePercent,
    title: "Preço escalonado real",
    text: `A partir de ${MIN_B2B} peças o valor por unidade já cai. Em 100+ o desconto passa de 50% em vários modelos.`,
  },
  {
    icon: FileText,
    title: "Nota fiscal e dados de cadastro",
    text: "Emitimos NF, mandamos os dados para cadastro de fornecedor e aceitamos ordem de compra.",
  },
  {
    icon: PenTool,
    title: "Arte e prova digital inclusas",
    text: "Adaptamos seu logo ou criamos a arte do zero. Você aprova o mockup antes de qualquer produção.",
  },
  {
    icon: Package,
    title: "Embalagem individual",
    text: "Cada peça vai protegida e conferida. Podemos separar por setor, nome ou lote de entrega.",
  },
  {
    icon: Truck,
    title: "Entrega para todo o Brasil",
    text: "Frete por CEP para todo o Brasil. No Rio, motoboy por aplicativo ou retirada no Uruguaiana / ponto a combinar.",
  },
  {
    icon: Building2,
    title: "Pagamento facilitado",
    text: "Link seguro do PagBank com Pix, cartão ou boleto. Volume grande pode ser dividido em entrada e saldo.",
  },
];

const steps = [
  {
    title: "Você conta o volume",
    text: "Diz o produto, a quantidade e a data que precisa. O site já mostra a faixa de preço na hora.",
  },
  {
    title: "Recebe a proposta",
    text: "Respondemos no WhatsApp em até 24h úteis com valor fechado, prazo e forma de pagamento.",
  },
  {
    title: "Aprova a prova digital",
    text: "Mandamos o mockup com o seu logo aplicado. Ajustamos até ficar do jeito da sua marca.",
  },
  {
    title: "Produzimos e entregamos",
    text: "Produção conferida peça por peça, embalagem individual e envio rastreado ou entrega no local.",
  },
];

const faq = [
  {
    q: "Qual a quantidade mínima para preço de atacado?",
    a: `${MIN_B2B} peças do mesmo produto. Abaixo disso o valor é o de varejo, mas o pedido continua sendo bem-vindo.`,
  },
  {
    q: "Posso misturar modelos para chegar na quantidade?",
    a: "Sim. A faixa é calculada por produto, mas em pedidos grandes a gente avalia o volume total do projeto e ajusta a proposta.",
  },
  {
    q: "Vocês emitem nota fiscal?",
    a: "Sim, para todos os pedidos corporativos. Enviamos também os dados para cadastro de fornecedor e aceitamos ordem de compra.",
  },
  {
    q: "Qual o prazo de produção em quantidade?",
    a: "De 3 a 7 dias úteis após a aprovação da arte para até 100 peças. Volumes maiores combinamos o cronograma junto com você.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Enviamos um link do PagBank (Pix, cartão ou boleto). Em pedidos grandes trabalhamos com entrada e saldo antes do envio.",
  },
];

function Calculator() {
  const tiers = usePriceTiers();
  const [modelKey, setModelKey] = useState("branca");
  const [quantity, setQuantity] = useState(100);

  useEffect(() => {
    if (!tiers.data) return;
    if (!tiers.data.models.some((model) => model.key === modelKey)) {
      setModelKey(tiers.data.models[0].key);
    }
  }, [tiers.data, modelKey]);

  const estimate = useModelEstimate(modelKey, Math.max(1, quantity));
  const model = useMemo(
    () => tiers.data?.models.find((item) => item.key === modelKey) ?? null,
    [tiers.data, modelKey],
  );

  const result = estimate.data;

  return (
    <div className="sticker grid gap-8 p-6 md:p-9 lg:grid-cols-[1fr_0.85fr]">
      <div>
        <span className="field-label">Produto</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {tiers.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))
            : tiers.data?.models.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setModelKey(item.key)}
                  className={cn(
                    "rounded-2xl border-[3px] border-navy px-4 py-3 text-left font-display text-sm font-bold transition",
                    item.key === modelKey
                      ? "bg-navy text-cream"
                      : "bg-white hover:bg-yellow/60",
                  )}
                >
                  {item.name}
                </button>
              ))}
        </div>

        <div className="mt-7 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="field-label">Quantidade</span>
            <input
              type="number"
              min={1}
              max={100000}
              value={quantity}
              onChange={(event) =>
                setQuantity(Math.max(1, Number(event.target.value) || 1))
              }
              className="field mt-2 w-32"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {quickQuantities.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuantity(value)}
                className={cn(
                  "rounded-full border-[3px] border-navy px-3 py-1.5 font-display text-sm font-bold transition",
                  quantity === value ? "bg-yellow" : "bg-white hover:bg-yellow/60",
                )}
              >
                {value} un.
              </button>
            ))}
          </div>
        </div>

        {model ? (
          <p className="mt-6 text-sm text-navy/60">
            Varejo (1 peça): {formatPrice(model.tiers[0].unit)} · faixas de
            atacado a partir de {MIN_B2B} peças.
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border-[3px] border-navy bg-navy p-6 text-cream">
        <span className="tag border-cream/40 bg-transparent text-yellow">
          Estimativa na hora
        </span>

        {estimate.isFetching && !result ? (
          <div className="mt-8 flex items-center gap-2 text-cream/70">
            <Spinner /> calculando…
          </div>
        ) : result ? (
          <>
            <p className="mt-5 font-display text-[clamp(2.2rem,5vw,3rem)] leading-none font-extrabold text-yellow">
              {formatPrice(result.unit)}
              <span className="ml-1 font-display text-base font-bold text-cream/70">
                /un
              </span>
            </p>
            <p className="mt-2 text-sm text-cream/70">{result.tierLabel}</p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3 border-b border-cream/15 pb-3">
                <dt className="text-cream/70">
                  Total de {quantity} {quantity === 1 ? "peça" : "peças"}
                </dt>
                <dd className="font-display text-lg font-extrabold">
                  {formatPrice(result.total)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream/70">Economia vs. varejo</dt>
                <dd className="font-display text-lg font-extrabold text-mint">
                  {formatPrice(result.saving)}
                  {result.savingPct > 0 ? ` (${result.savingPct}%)` : ""}
                </dd>
              </div>
            </dl>

            <Link
              to="/pedido?empresa=1"
              className="btn btn-primary mt-7 w-full justify-center"
            >
              Pedir proposta com esse volume
            </Link>
            <a
              href={whatsappLink(
                `Olá! Quero um orçamento corporativo: ${result.modelName} — ${quantity} unidades.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-yellow underline"
            >
              <FaWhatsapp className="size-4" />
              Falar direto no WhatsApp
            </a>

            <p className="mt-5 text-xs text-cream/55">
              Valor de referência para arte em 1 posição. O preço final é
              confirmado por nós depois de ver a arte, o acabamento e o prazo.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-cream/70">
            Escolha um produto e a quantidade para ver o preço por unidade.
          </p>
        )}
      </div>
    </div>
  );
}

function PriceTable() {
  const tiers = usePriceTiers();
  const labels = tiers.data?.models[0]?.tiers.map((tier) => tier.label) ?? [];

  return (
    <div className="mt-10 overflow-x-auto rounded-3xl border-[3px] border-navy bg-white shadow-[6px_6px_0_var(--color-navy)]">
      {tiers.isLoading ? (
        <Skeleton className="h-72 !rounded-3xl !border-0" />
      ) : (
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="bg-navy text-cream">
              <th className="p-4 text-left font-display font-bold">Produto</th>
              {labels.map((label) => (
                <th
                  key={label}
                  className="p-4 text-right font-display font-bold whitespace-nowrap"
                >
                  {label.replace(" unidades", " un.").replace(" (varejo)", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tiers.data?.models.map((model, i) => (
              <tr
                key={model.key}
                className={cn(
                  "border-t-[3px] border-navy/10",
                  i % 2 === 1 && "bg-cream/60",
                )}
              >
                <th className="p-4 text-left font-display font-bold">
                  {model.name}
                </th>
                {model.tiers.map((tier) => (
                  <td
                    key={tier.label}
                    className="p-4 text-right font-semibold whitespace-nowrap"
                  >
                    {formatPrice(tier.unit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function EmpresasPage() {
  useSeo({
    title: "Brindes corporativos e canecas no atacado",
    description:
      "Canecas e brindes personalizados para empresas, revendas e eventos. A partir de 15 peças, com desconto por volume de até 60%. Orçamento na hora.",
  });
  usePageView("/empresas");
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-cream">
        <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-blue/25" />
        <div className="pointer-events-none absolute -bottom-10 -left-24 size-56 rounded-full bg-magenta/10" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pt-14 pb-40 md:px-8 md:pt-20 md:pb-44 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="reveal">
            <span className="tag border-cream/40 bg-transparent text-yellow">
              <Building2 className="size-3.5" strokeWidth={2.5} />
              Para empresas, eventos e revenda
            </span>

            <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.6rem)] text-cream">
              Brinde com a sua marca e{" "}
              <span className="script text-[1.1em] text-yellow">
                preço de atacado
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-cream/75">
              Caneca, camisa e azulejo personalizados em quantidade, com preço
              que cai conforme o volume, nota fiscal e prova digital antes de
              produzir. A partir de {MIN_B2B} peças você já paga atacado.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pedido?empresa=1" className="btn btn-primary text-lg">
                Pedir orçamento para empresa
              </Link>
              <a
                href={whatsappLink(
                  "Olá! Sou de uma empresa e quero um orçamento de brindes personalizados em quantidade.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost bg-cream text-lg"
              >
                <FaWhatsapp className="size-5" />
                Falar com o comercial
              </a>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: `${MIN_B2B} un.`, v: "mínimo para atacado" },
                { k: "até 60%", v: "de desconto por volume" },
                { k: "24h", v: "para receber a proposta" },
                { k: "NF-e", v: "em todo pedido corporativo" },
              ].map((stat) => (
                <div
                  key={stat.k}
                  className="rounded-2xl border-[3px] border-cream/25 p-4"
                >
                  <dt className="font-display text-xl font-extrabold text-yellow">
                    {stat.k}
                  </dt>
                  <dd className="mt-1 text-xs text-cream/65">{stat.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal relative" style={{ animationDelay: "120ms" }}>
            <div className="sticker floaty overflow-hidden !rounded-[32px] p-0">
              <img
                src="/images/real-natal-empresa.jpg"
                alt="Lote de canecas de Natal personalizadas com a marca do cliente, empilhadas em pirâmide"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="sticker absolute -bottom-6 left-3 !rounded-2xl bg-yellow px-4 py-3 sm:left-6 lg:-left-6">
              <p className="script text-2xl leading-none">
                quanto mais, mais barato
              </p>
            </div>
          </div>
        </div>

        <Wave className="absolute bottom-0 left-0 z-0" fill="#FFF6E3" />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pt-20 md:px-8 md:pt-24">
        <SectionTitle
          kicker="Lotes que já saíram daqui"
          title="Produção real,"
          script="não maquete"
          align="center"
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {[
            {
              src: "/images/real-formandos-pre2.jpg",
              alt: "Lote de canecas de formandos com o nome da turma impresso",
              legenda: "Formatura de turma",
            },
            {
              src: "/images/real-turma-nomes.jpg",
              alt: "Canecas de escola, cada uma com o nome de um aluno",
              legenda: "Um nome por peça",
            },
            {
              src: "/images/real-15anos-lote.jpg",
              alt: "Lote de canecas de lembrança de festa de 15 anos",
              legenda: "Festa de 15 anos",
            },
            {
              src: "/images/real-lote-formatura.jpg",
              alt: "Canecas de formatura empilhadas em pirâmide",
              legenda: "Lembrança de formatura",
            },
          ].map((foto, i) => (
            <figure
              key={foto.src}
              className="sticker reveal overflow-hidden !rounded-[26px] p-0"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <img
                src={foto.src}
                alt={foto.alt}
                width={1200}
                height={1200}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <figcaption className="border-t-[3px] border-navy bg-cream px-3 py-2 text-center text-xs font-semibold text-navy">
                {foto.legenda}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pt-24 pb-20 md:px-8 md:pt-28 md:pb-24">
        <SectionTitle
          kicker="Calculadora de atacado"
          title="Veja o seu preço"
          script="por quantidade"
          align="center"
        />
        <p className="mx-auto mt-4 max-w-2xl text-center text-navy/70">
          Escolha o produto e o volume: o valor por peça é calculado na hora com
          a nossa tabela de atacado.
        </p>
        <div className="mt-10">
          <Calculator />
        </div>
      </section>

      <section className="relative bg-yellow pt-20 pb-28 md:pt-24 md:pb-32">
        <Wave className="absolute -top-[51px] left-0 z-0" fill="#EEDA10" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle
            kicker="Transparência"
            title="Tabela completa de"
            script="preço por volume"
          />
          <p className="mt-4 max-w-2xl text-navy/70">
            Preço por unidade, sem letra miúda. Valores para arte em 1 posição;
            acabamentos especiais e prazos urgentes são combinados na proposta.
          </p>
          <PriceTable />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/pedido?empresa=1" className="btn btn-navy">
              Fazer pedido corporativo
            </Link>
            <a
              href={whatsappLink(
                "Olá! Quero um orçamento corporativo com quantidade personalizada.",
              )}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost bg-white"
            >
              <FaWhatsapp className="size-4" />
              Pedir proposta no WhatsApp
            </a>
          </div>
        </div>
        <Wave className="absolute bottom-0 left-0 z-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <SectionTitle
          kicker="Quem compra em quantidade"
          title="Projetos que a gente"
          script="atende todo mês"
          align="center"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((item, i) => (
            <div
              key={item.title}
              className="sticker reveal p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`grid size-13 place-items-center rounded-2xl border-[3px] border-navy ${item.color}`}
              >
                <item.icon className="size-6" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-navy/65">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-blue pt-20 pb-28 md:pt-24 md:pb-32">
        <Wave className="absolute -top-[51px] left-0 z-0" fill="#7BC7EF" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle
            kicker="Como trabalhamos com empresa"
            title="Sem burocracia,"
            script="do jeito certo"
            align="center"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {perks.map((item, i) => (
              <div
                key={item.title}
                className="sticker reveal p-6"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="grid size-13 place-items-center rounded-2xl border-[3px] border-navy bg-cream">
                  <item.icon className="size-6" strokeWidth={2.5} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-navy/65">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        <Wave className="absolute bottom-0 left-0 z-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionTitle
            kicker="Passo a passo"
            title="Do primeiro contato"
            script="à entrega"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="sticker reveal relative p-6"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="absolute -top-4 -right-3 grid size-10 place-items-center rounded-full border-[3px] border-navy bg-navy font-display text-lg font-extrabold text-cream">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-navy/65">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 md:px-8 md:pb-24">
        <SectionTitle
          kicker="Dúvidas de comprador"
          title="Perguntas que"
          script="sempre chegam"
          align="center"
        />

        <div className="mt-10 grid gap-3">
          {faq.map((item) => (
            <details key={item.q} className="sticker group p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-bold">
                {item.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full border-[3px] border-navy font-display text-sm group-open:bg-yellow">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-navy/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8 md:pb-24">
        <div className="sticker relative overflow-hidden bg-magenta p-10 text-center text-white md:p-16">
          <div className="pointer-events-none absolute -top-16 -left-10 size-52 rounded-full bg-yellow/30" />
          <div className="pointer-events-none absolute -right-10 -bottom-16 size-52 rounded-full bg-blue/40" />
          <div className="relative">
            <h2 className="text-[clamp(2rem,5vw,3.4rem)] text-white">
              Manda o volume que{" "}
              <span className="script text-[1.15em] text-yellow">
                a gente cota hoje
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Diga o produto, a quantidade e a data. Você recebe a proposta com
              preço fechado, prazo e forma de pagamento em até 24h úteis.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/pedido?empresa=1" className="btn btn-navy text-lg">
                Pedir orçamento para empresa
              </Link>
              <a
                href={whatsappLink(
                  "Olá! Quero falar com o comercial sobre brindes corporativos.",
                )}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost bg-white text-lg"
              >
                <FaWhatsapp className="size-5" />
                Chamar no WhatsApp
              </a>
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-white/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                {site.whatsappDisplay}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                @{site.instagram}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                {site.hours}
              </span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
