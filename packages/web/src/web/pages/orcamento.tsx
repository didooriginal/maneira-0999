import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Palette,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useCreateQuote, usePriceTiers } from "../queries/catalog";
import { SectionTitle, Spinner, Wave } from "../components/ui/bits";
import { formatPrice, site, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";

interface QuoteForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  quantity: number;
  mugType: string;
  deadline: string;
  message: string;
}

type ClientType = "pessoal" | "empresa";
type HasArt = "tenho-arte" | "tenho-ideia" | "preciso-de-ajuda";

const mugTypes = [
  "Caneca temática",
  "Caneca colorida",
  "Caneca de chopp",
  "Caneca para crianças",
  "Caneca mágica",
  "Caneca glitter",
  "Caneca com caricatura",
  "Caneca com historinha personalizada",
  "Camisa (sublimação ou DTF)",
  "Azulejo personalizado",
  "Quadro sublimado",
  "Ainda não sei",
];

const deadlines = [
  "Sem pressa (15+ dias)",
  "Em até 15 dias",
  "Em até 7 dias",
  "Urgente (até 3 dias)",
];

const artOptions: { key: HasArt; label: string; hint: string; icon: typeof Palette }[] = [
  {
    key: "tenho-arte",
    label: "Já tenho a arte",
    hint: "Arquivo pronto em PNG, PDF ou AI",
    icon: CheckCircle2,
  },
  {
    key: "tenho-ideia",
    label: "Tenho a ideia",
    hint: "Sei o que quero, falta montar",
    icon: Sparkles,
  },
  {
    key: "preciso-de-ajuda",
    label: "Preciso de ajuda",
    hint: "Nossa equipe cria pra você",
    icon: Palette,
  },
];

const perks = [
  { icon: Users, title: "A partir de 10 unidades", text: "Quanto maior o lote, menor o preço por caneca." },
  { icon: Palette, title: "Arte inclusa", text: "Criamos ou adaptamos seu layout sem custo extra." },
  { icon: Clock, title: "Resposta em 24h úteis", text: "Orçamento detalhado direto no seu WhatsApp." },
  { icon: Truck, title: "Entrega pro Brasil inteiro", text: "Embalagem reforçada e seguro contra quebra." },
];

export default function OrcamentoPage() {
  const tiers = usePriceTiers();
  const createQuote = useCreateQuote();

  const [clientType, setClientType] = useState<ClientType>("empresa");
  const [hasArt, setHasArt] = useState<HasArt>("tenho-ideia");
  const [code, setCode] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuoteForm>({
    defaultValues: { quantity: 50, mugType: mugTypes[0], deadline: deadlines[1] },
  });

  const quantity = Number(watch("quantity")) || 0;
  const mugType = watch("mugType");

  const model = useMemo(() => {
    if (!tiers.data) return null;
    const key = tiers.data.optionToModel[mugType] ?? null;
    if (!key) return null;
    return tiers.data.models.find((item) => item.key === key) ?? null;
  }, [tiers.data, mugType]);

  const estimate = useMemo(() => {
    if (!model || quantity < 1) return null;
    const tier =
      model.tiers.find((t) => quantity >= t.min && quantity <= t.max) ??
      model.tiers[model.tiers.length - 1];
    return {
      tier,
      total: tier.unit * quantity,
      modelName: model.name,
      estimated: model.estimated,
    };
  }, [model, quantity]);

  async function onSubmit(values: QuoteForm) {
    const result = await createQuote.mutateAsync({
      name: values.name,
      email: values.email,
      phone: values.phone,
      clientType,
      company: values.company || undefined,
      quantity: Number(values.quantity),
      mugType: values.mugType,
      deadline: values.deadline || undefined,
      hasArt,
      message: values.message,
    });

    const artLabel =
      artOptions.find((option) => option.key === hasArt)?.label ?? hasArt;
    const lines = [
      `*Novo orçamento pelo site — ${result.code}*`,
      "",
      `Nome: ${values.name}`,
      clientType === "empresa" && values.company
        ? `Empresa: ${values.company}`
        : `Tipo: ${clientType === "empresa" ? "Empresa" : "Pessoal"}`,
      `WhatsApp/Telefone: ${values.phone}`,
      `E-mail: ${values.email}`,
      "",
      `Produto: ${values.mugType}`,
      `Quantidade: ${values.quantity}`,
      `Prazo: ${values.deadline}`,
      `Arte: ${artLabel}`,
      estimate
        ? `Estimativa do site: ${formatPrice(estimate.total)} (${formatPrice(estimate.tier.unit)}/un)`
        : null,
      values.message ? `` : null,
      values.message ? `Observações: ${values.message}` : null,
    ].filter(Boolean) as string[];

    const url = whatsappLink(lines.join("\n"));
    setWaUrl(url);
    setCode(result.code);
    window.open(url, "_blank", "noopener,noreferrer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (code) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="sticker reveal grain relative overflow-hidden p-8 text-center sm:p-12">
          <div className="mx-auto grid size-16 place-items-center rounded-full border-[3px] border-navy bg-mint">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-6 text-[clamp(1.8rem,4vw,2.6rem)]">
            Pedido de orçamento{" "}
            <span className="script text-magenta text-[1.15em]">enviado!</span>
          </h1>
          <p className="mt-3 text-navy/70">
            Abrimos o WhatsApp com o seu pedido já escrito — só falta você
            apertar enviar. Se a janela não abriu, use o botão abaixo.
          </p>

          <div className="mt-8 rounded-2xl border-[3px] border-dashed border-navy/30 bg-cream p-5">
            <span className="field-label mb-1">Seu protocolo</span>
            <div className="flex items-center justify-center gap-3">
              <strong className="font-display text-2xl tracking-wide">
                {code}
              </strong>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="grid size-9 place-items-center rounded-full border-[3px] border-navy bg-white transition hover:bg-yellow"
                aria-label="Copiar protocolo"
              >
                <Copy className="size-4" />
              </button>
            </div>
            {copied ? (
              <span className="mt-2 block text-xs font-semibold text-magenta">
                Copiado!
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              className="btn btn-primary"
              href={
                waUrl ??
                whatsappLink(`Olá! Acabei de enviar o orçamento ${code} pelo site.`)
              }
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp className="size-4" />
              Enviar no WhatsApp
            </a>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setWaUrl(null);
                setCode(null);
              }}
            >
              Enviar outro orçamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-blue pt-16 pb-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="reveal">
              <span className="tag bg-yellow">Brindes e lotes</span>
              <h1 className="mt-4 text-[clamp(2.2rem,5.5vw,4rem)]">
                Peça um orçamento{" "}
                <span className="script text-[1.1em] text-navy">sem compromisso</span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-navy/80">
                Canecas personalizadas para empresas, eventos, casamentos,
                igrejas, times e qualquer ideia maluca que você tiver. Conta pra
                gente o que precisa que a gente monta o preço certinho.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {perks.map((perk) => (
                <div key={perk.title} className="sticker reveal p-4">
                  <perk.icon className="size-6 text-magenta" />
                  <h3 className="mt-2 text-base">{perk.title}</h3>
                  <p className="mt-1 text-sm text-navy/70">{perk.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Wave className="absolute bottom-0 left-0" fill="#FFF6E3" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="sticker space-y-8 p-6 sm:p-8"
            noValidate
          >
            <div>
              <h2 className="text-2xl">Quem está pedindo?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "empresa", label: "Sou empresa", icon: Building2 },
                    { key: "pessoal", label: "Sou pessoa física", icon: Users },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setClientType(option.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-[3px] border-navy px-4 py-3 text-left font-semibold transition",
                      clientType === option.key
                        ? "bg-yellow shadow-[4px_4px_0_var(--color-navy)]"
                        : "bg-white hover:bg-cream",
                    )}
                  >
                    <option.icon className="size-5" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="name">
                  Nome completo
                </label>
                <input
                  id="name"
                  className="field"
                  placeholder="Como podemos te chamar?"
                  {...register("name", { required: true, minLength: 3 })}
                />
                {errors.name ? (
                  <span className="mt-1 block text-xs font-semibold text-magenta">
                    Informe seu nome (mínimo 3 letras).
                  </span>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="company">
                  Empresa {clientType === "pessoal" ? "(opcional)" : ""}
                </label>
                <input
                  id="company"
                  className="field"
                  placeholder="Nome da empresa"
                  {...register("company", {
                    required: clientType === "empresa",
                  })}
                />
                {errors.company ? (
                  <span className="mt-1 block text-xs font-semibold text-magenta">
                    Informe o nome da empresa.
                  </span>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className="field"
                  placeholder="voce@email.com"
                  {...register("email", {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  })}
                />
                {errors.email ? (
                  <span className="mt-1 block text-xs font-semibold text-magenta">
                    Informe um e-mail válido.
                  </span>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="phone">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  className="field"
                  placeholder="(11) 90000-0000"
                  {...register("phone", { required: true, minLength: 8 })}
                />
                {errors.phone ? (
                  <span className="mt-1 block text-xs font-semibold text-magenta">
                    Informe um telefone com DDD.
                  </span>
                ) : null}
              </div>
            </div>

            <div className="border-t-[3px] border-dashed border-navy/20 pt-8">
              <h2 className="text-2xl">Sobre o pedido</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="field-label" htmlFor="quantity">
                    Quantidade
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min={1}
                    className="field"
                    {...register("quantity", {
                      required: true,
                      min: 1,
                      valueAsNumber: true,
                    })}
                  />
                  {errors.quantity ? (
                    <span className="mt-1 block text-xs font-semibold text-magenta">
                      Mínimo de 1 unidade.
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="mugType">
                    O que você quer personalizar
                  </label>
                  <select id="mugType" className="field" {...register("mugType")}>
                    {mugTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="deadline">
                    Prazo desejado
                  </label>
                  <select id="deadline" className="field" {...register("deadline")}>
                    {deadlines.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="field-label mt-6">Como está a arte?</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {artOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setHasArt(option.key)}
                    className={cn(
                      "rounded-2xl border-[3px] border-navy p-4 text-left transition",
                      hasArt === option.key
                        ? "bg-mint shadow-[4px_4px_0_var(--color-navy)]"
                        : "bg-white hover:bg-cream",
                    )}
                  >
                    <option.icon className="size-5" />
                    <span className="mt-2 block font-display font-bold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs text-navy/70">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="field-label" htmlFor="message">
                  Conta pra gente a ideia
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="field resize-y"
                  placeholder="Ex: 80 canecas brancas com o logo da empresa em 2 cores, entrega em Campinas até o fim do mês."
                  {...register("message", { required: true, minLength: 5 })}
                />
                {errors.message ? (
                  <span className="mt-1 block text-xs font-semibold text-magenta">
                    Descreva o pedido com pelo menos 5 caracteres.
                  </span>
                ) : null}
              </div>
            </div>

            {createQuote.isError ? (
              <p className="rounded-2xl border-[3px] border-magenta bg-magenta/10 p-4 text-sm font-semibold text-magenta">
                Não conseguimos enviar agora. Tenta de novo ou chama no
                WhatsApp.
              </p>
            ) : null}

            <button
              type="submit"
              className="btn btn-primary w-full text-lg"
              disabled={createQuote.isPending}
            >
              {createQuote.isPending ? (
                <>
                  <Spinner /> Enviando...
                </>
              ) : (
                <>
                  <FaWhatsapp className="size-5" />
                  Enviar orçamento no WhatsApp
                </>
              )}
            </button>
            <p className="text-center text-xs text-navy/60">
              Sem compromisso. Ao enviar, abrimos o WhatsApp com o seu pedido
              já preenchido — você só confirma o envio.
            </p>
          </form>

          <aside className="lg:sticky lg:top-28">
            <div className="sticker bg-navy p-6 text-cream">
              <span className="tag border-cream/40 bg-cream/10 text-cream">
                Estimativa
              </span>
              <h3 className="mt-4 text-2xl text-cream">
                Quanto sai o seu lote?
              </h3>

              {tiers.isPending ? (
                <p className="mt-4 text-sm text-cream/70">Calculando faixas...</p>
              ) : estimate ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-mint">
                    {estimate.modelName}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    {quantity} unidades × {formatPrice(estimate.tier.unit)}
                  </p>
                  <strong className="mt-1 block font-display text-4xl text-yellow">
                    {formatPrice(estimate.total)}
                  </strong>
                  <p className="mt-2 text-xs text-cream/60">
                    Faixa {estimate.tier.label}. Valor estimado — a arte, o
                    acabamento e o frete podem alterar o total.
                  </p>
                  {estimate.estimated ? (
                    <p className="mt-2 rounded-xl bg-cream/10 px-3 py-2 text-xs text-cream/80">
                      Preço de referência para este modelo. Confirmamos o valor
                      final no WhatsApp.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 text-sm text-cream/70">
                  Este item é orçado sob consulta. Envie o formulário que a
                  gente monta o preço certinho pra você.
                </p>
              )}

              {model ? (
                <div className="mt-6 space-y-2 border-t border-cream/20 pt-4">
                  {model.tiers.map((tier) => (
                    <div
                      key={tier.label}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                        estimate?.tier.label === tier.label
                          ? "bg-yellow font-bold text-navy"
                          : "text-cream/75",
                      )}
                    >
                      <span>{tier.label}</span>
                      <span>{formatPrice(tier.unit)}/un</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="sticker mt-4 bg-yellow p-5">
              <h3 className="text-lg">Prefere conversar?</h3>
              <p className="mt-1 text-sm text-navy/75">
                Chama no WhatsApp {site.whatsappDisplay}. {site.hours}.
              </p>
              <a
                className="btn btn-navy mt-4 w-full"
                href={whatsappLink("Olá! Quero um orçamento de canecas personalizadas.")}
                target="_blank"
                rel="noreferrer"
              >
                Falar agora
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
