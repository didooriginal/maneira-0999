import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useForm } from "react-hook-form";
import {
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Package,
  Palette,
  Paperclip,
  Store,
  Sparkles,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  useCreateQuote,
  usePriceTiers,
  useProductLines,
  useShippingQuote,
} from "../queries/catalog";
import { Spinner, Wave } from "../components/ui/bits";
import { FaixaGaleria } from "../components/faixa-galeria";
import {
  type PickupKey,
  formatPrice,
  pickupPoints,
  site,
  whatsappLink,
} from "../lib/site";
import { cn } from "../lib/utils";
import { useSeo } from "../hooks/use-seo";
import { usePageView, useAnalytics } from "../hooks/use-analytics";
import { gaLead } from "../lib/ga";

interface OrderForm {
  name: string;
  phone: string;
  company: string;
  quantity: number;
  mugType: string;
  deadline: string;
  cep: string;
  message: string;
}

type ClientType = "pessoal" | "empresa";
type HasArt = "tenho-arte" | "tenho-ideia" | "preciso-de-ajuda";

type DeliveryMode = "motoboy" | "retirada" | "envio";

const deliveryOptions: {
  key: DeliveryMode;
  label: string;
  hint: string;
  icon: typeof Truck;
}[] = [
  {
    key: "motoboy",
    label: "Motoboy no Rio",
    hint: "Entrega por aplicativo, valor a combinar",
    icon: Bike,
  },
  {
    key: "retirada",
    label: "Retirar em mãos",
    hint: "No Centro, em Irajá ou ponto combinado",
    icon: Store,
  },
  {
    key: "envio",
    label: "Enviar pelo Brasil",
    hint: "Calcule o frete pelo seu CEP",
    icon: Truck,
  },
];
type LineSlug = "caneca" | "camisa" | "azulejo";

/** Fallback enquanto a tabela do servidor não carrega. */
const fallbackDeadlines = [
  "Sem pressa (15+ dias)",
  "Em até 15 dias",
  "Em até 7 dias",
  "Em até 3 dias",
  "Urgente (1 dia útil)",
];

const artOptions: {
  key: HasArt;
  label: string;
  hint: string;
  icon: typeof Palette;
}[] = [
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
    label: "Nós criamos pra você",
    hint: "Manda a referência que a gente desenha",
    icon: Palette,
  },
];

const perks = [
  {
    icon: Palette,
    title: "A arte é por nossa conta",
    text: "Criamos ou ajustamos seu layout sem cobrar à parte.",
  },
  {
    icon: CheckCircle2,
    title: "Prova digital antes",
    text: "Você aprova a imagem final antes da gente produzir.",
  },
  {
    icon: Clock,
    title: "Resposta em 24h úteis",
    text: "Respondemos no seu WhatsApp com o valor fechado.",
  },
  {
    icon: Truck,
    title: "Enviamos pro Brasil inteiro",
    text: "Embalagem reforçada e reposição se quebrar no caminho.",
  },
];

export default function PedidoFormPage() {
  const params = useParams<{ linha?: string }>();
  const { trackEvent } = useAnalytics();
  const lines = useProductLines();
  const tiers = usePriceTiers();
  const createQuote = useCreateQuote();
  const shipping = useShippingQuote();

  const [lineSlug, setLineSlug] = useState<LineSlug>("caneca");

  const seoByLine: Record<LineSlug, { title: string; description: string }> = {
    caneca: {
      title: "Fazer meu pedido de caneca personalizada",
      description:
        "Monte seu pedido de canecas personalizadas em 1 minuto: escolha o modelo, a quantidade e calcule o frete pelo CEP. Orçamento na hora, sem compromisso.",
    },
    camisa: {
      title: "Fazer meu pedido de camisa personalizada",
      description:
        "Camisas personalizadas por sublimação ou estampa total. Monte seu pedido, veja o preço e calcule o frete pelo CEP.",
    },
    azulejo: {
      title: "Fazer meu pedido de azulejo personalizado",
      description:
        "Azulejos personalizados com a sua foto ou frase. Monte seu pedido, veja o preço e calcule o frete pelo CEP.",
    },
  };
  const [clientType, setClientType] = useState<ClientType>("pessoal");
  const [hasArt, setHasArt] = useState<HasArt>("tenho-ideia");
  const [code, setCode] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderForm>({
    defaultValues: {
      quantity: 1,
      mugType: "Caneca temática",
      deadline: fallbackDeadlines[1],
      cep: "",
    },
  });

  useSeo(seoByLine[lineSlug]);
  usePageView(`/pedido/${lineSlug}`);

  // ?empresa=1 → já abre o formulário no modo corporativo
  useEffect(() => {
    const params_ = new URLSearchParams(window.location.search);
    if (params_.get("empresa") === "1") {
      setClientType("empresa");
      setValue("quantity", 30);
    }
  }, [setValue]);

  // Linha vinda da URL (/pedido/camisa)
  useEffect(() => {
    const slug = params.linha;
    if (slug === "caneca" || slug === "camisa" || slug === "azulejo") {
      setLineSlug(slug);
    }
  }, [params.linha]);

  const line = useMemo(
    () => lines.data?.find((item) => item.slug === lineSlug) ?? null,
    [lines.data, lineSlug],
  );

  // Ao trocar de linha, garante que o modelo escolhido pertence a ela
  useEffect(() => {
    if (!line) return;
    const current = watch("mugType");
    if (!line.options.includes(current)) {
      setValue("mugType", line.options[0]);
    }
  }, [line, setValue, watch]);

  /* ?tipo=Caneca+colorida → já abre no modelo que o cliente clicou em
     /modelos. Roda depois do ajuste de linha acima para não ser sobrescrito,
     e só aceita rótulo que existe de verdade na linha. */
  useEffect(() => {
    if (!line) return;
    const tipo = new URLSearchParams(window.location.search).get("tipo");
    if (tipo && line.options.includes(tipo)) setValue("mugType", tipo);
  }, [line, setValue]);

  const quantity = Number(watch("quantity")) || 0;
  const mugType = watch("mugType");
  const cep = watch("cep");

  const model = useMemo(() => {
    if (!tiers.data) return null;
    const key = tiers.data.optionToModel[mugType] ?? null;
    if (!key) return null;
    return tiers.data.models.find((item) => item.key === key) ?? null;
  }, [tiers.data, mugType]);

  const deadlines = tiers.data?.deadlines ?? fallbackDeadlines;
  const rushRule = tiers.data?.rush ?? null;
  const deadline = watch("deadline");
  const wantsRush = Boolean(rushRule) && deadline === rushRule?.label;
  /** Acima do limite de peças o prazo de 1 dia útil não é garantido. */
  const rushOverLimit =
    wantsRush && rushRule ? quantity > rushRule.maxQuantity : false;
  const rushApplied = wantsRush && !rushOverLimit;

  const estimate = useMemo(() => {
    if (!model || quantity < 1) return null;
    const tier =
      model.tiers.find((t) => quantity >= t.min && quantity <= t.max) ??
      model.tiers[model.tiers.length - 1];
    const subtotal = tier.unit * quantity;
    const rushFee = rushApplied && rushRule ? subtotal * rushRule.pct : 0;
    return {
      tier,
      subtotal,
      rushFee,
      total: subtotal + rushFee,
      modelName: model.name,
      estimated: model.estimated,
    };
  }, [model, quantity, rushApplied, rushRule]);

  /** Próxima faixa de atacado, usada para mostrar o ganho por volume. */
  const nextTier = useMemo(() => {
    if (!model || quantity < 1) return null;
    const next = model.tiers.find((tier) => tier.min > quantity);
    if (!next) return null;
    const current =
      model.tiers.find((t) => quantity >= t.min && quantity <= t.max) ??
      model.tiers[0];
    if (next.unit >= current.unit) return null;
    return { ...next, save: current.unit - next.unit };
  }, [model, quantity]);

  const shippingResult = shipping.data?.ok ? shipping.data : null;
  const [shippingPick, setShippingPick] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("envio");
  const [pickupPoint, setPickupPoint] = useState<PickupKey>("uruguaiana");

  const chosenShipping = useMemo(() => {
    if (deliveryMode !== "envio") return null;
    if (!shippingResult) return null;
    return (
      shippingResult.options.find((o) => o.id === shippingPick) ??
      shippingResult.options[0] ??
      null
    );
  }, [deliveryMode, shippingResult, shippingPick]);

  async function calcShipping() {
    const digits = (cep ?? "").replace(/\D/g, "");
    if (digits.length !== 8) return;
    setShippingPick(null);
    await shipping.mutateAsync({ cep: digits, quantity: Math.max(1, quantity) });
    trackEvent("frete_calculado", { cep: digits.slice(0, 5), quantity });
  }

  async function onSubmit(values: OrderForm) {
    const shippingLabel =
      deliveryMode === "motoboy"
        ? "Motoboy por aplicativo no Rio de Janeiro — valor a combinar"
        : deliveryMode === "retirada"
          ? `Retirada em mãos — ${
              pickupPoints.find((point) => point.key === pickupPoint)
                ?.address ?? "local a combinar"
            }`
          : chosenShipping
            ? `${chosenShipping.company} ${chosenShipping.name} — ${formatPrice(chosenShipping.price)} (${chosenShipping.deliveryDays} dias)`
            : undefined;

    const result = await createQuote.mutateAsync({
      name: values.name,
      phone: values.phone,
      clientType,
      company: values.company || undefined,
      quantity: Number(values.quantity),
      mugType: values.mugType,
      productLine: lineSlug,
      cep: deliveryMode === "envio" ? values.cep || undefined : undefined,
      shippingChoice: shippingLabel,
      deadline: values.deadline || undefined,
      hasArt,
      message: values.message,
    });

    const artLabel =
      artOptions.find((option) => option.key === hasArt)?.label ?? hasArt;

    const lines_ = [
      `*Novo pedido pelo site — ${result.code}*`,
      "",
      `Produto: ${line?.name ?? "Caneca"} — ${values.mugType}`,
      `Quantidade: ${values.quantity}`,
      estimate
        ? `Estimativa do site: ${formatPrice(estimate.total)} (${formatPrice(estimate.tier.unit)}/un)`
        : null,
      estimate && estimate.rushFee > 0
        ? `Inclui urgência ${Math.round((rushRule?.pct ?? 0) * 100)}%: ${formatPrice(estimate.rushFee)}`
        : null,
      rushOverLimit
        ? `ATENÇÃO: pedi 1 dia útil para ${quantity} peças — acima do limite de ${rushRule?.maxQuantity}. Preciso confirmar o prazo.`
        : null,
      shippingLabel ? `Entrega: ${shippingLabel}` : null,
      deliveryMode === "envio" && values.cep ? `CEP: ${values.cep}` : null,
      `Prazo: ${values.deadline}`,
      `Arte: ${artLabel}`,
      hasArt === "tenho-arte"
        ? "(vou anexar o arquivo da arte aqui na conversa)"
        : null,
      "",
      `Nome: ${values.name}`,
      clientType === "empresa" && values.company
        ? `Empresa: ${values.company}`
        : `Tipo: ${clientType === "empresa" ? "Empresa" : "Pessoa física"}`,
      `WhatsApp: ${values.phone}`,
      "",
      `Ideia: ${values.message}`,
    ].filter(Boolean) as string[];

    trackEvent("orcamento_enviado", {
      line: lineSlug,
      clientType,
      quantity: values.quantity,
      deliveryMode,
      rush: rushApplied,
      hasShipping: Boolean(chosenShipping),
    });

    /* Conversão principal: o formulário virou pedido gravado no banco.
       O valor é a estimativa do servidor, para o Ads saber quanto vale o lead. */
    gaLead("formulario_pedido", {
      value: estimate?.total ?? 0,
      currency: "BRL",
      line: lineSlug,
      quantity: values.quantity,
      code: result.code,
    });

    const url = whatsappLink(lines_.join("\n"));
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
            Pedido{" "}
            <span className="script text-magenta text-[1.15em]">enviado!</span>
          </h1>
          <p className="mt-3 text-navy/70">
            Abrimos o WhatsApp com o seu pedido já escrito — só falta você
            apertar enviar. Se a janela não abriu, use o botão abaixo.
          </p>

          {hasArt === "tenho-arte" ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border-[3px] border-navy bg-yellow/40 p-4 text-left">
              <Paperclip className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-semibold text-navy">
                Não esqueça de anexar o arquivo da sua arte na conversa do
                WhatsApp — PNG, JPG, PDF ou AI em boa resolução.
              </p>
            </div>
          ) : null}

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

          <p className="mt-6 text-sm text-navy/60">
            O pagamento é combinado no WhatsApp — enviamos um link seguro do
            PagBank (Pix, cartão ou boleto) assim que a arte for aprovada.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              className="btn btn-primary"
              href={
                waUrl ??
                whatsappLink(`Olá! Acabei de enviar o pedido ${code} pelo site.`)
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
              Fazer outro pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-blue pt-14 pb-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="reveal max-w-2xl">
            <span className="tag bg-yellow">Pedido personalizado</span>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.4rem)]">
              Conta a sua ideia que a gente{" "}
              <span className="script text-[1.1em] text-navy">faz o modelo</span>
            </h1>
            <p className="mt-4 text-lg text-navy/80">
              Sem catálogo engessado: você descreve o que quer, a gente cria a
              arte, mostra a prova digital e só produz depois que você aprovar.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="sticker reveal p-4">
                <perk.icon className="size-6 text-magenta" />
                <h3 className="mt-2 text-base">{perk.title}</h3>
                <p className="mt-1 text-sm text-navy/70">{perk.text}</p>
              </div>
            ))}
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
              <h2 className="text-2xl">O que você quer personalizar?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(lines.data ?? []).map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setLineSlug(item.slug as LineSlug)}
                    className={cn(
                      "rounded-2xl border-[3px] border-navy p-4 text-left transition",
                      lineSlug === item.slug
                        ? "shadow-[4px_4px_0_var(--color-navy)]"
                        : "bg-white hover:bg-cream",
                    )}
                    style={
                      lineSlug === item.slug
                        ? { backgroundColor: item.color }
                        : undefined
                    }
                  >
                    <Package className="size-5" />
                    <span className="mt-2 block font-display font-bold">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-navy/70">
                      {item.priceNote}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border-t-[3px] border-dashed border-navy/20 pt-8 sm:grid-cols-3">
              <div>
                <label className="field-label" htmlFor="mugType">
                  Modelo
                </label>
                <select id="mugType" className="field" {...register("mugType")}>
                  {(line?.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

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

            {wantsRush && rushRule ? (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border-[3px] border-navy p-4",
                  rushOverLimit ? "bg-magenta/15" : "bg-yellow/40",
                )}
              >
                <Zap className="mt-0.5 size-5 shrink-0" />
                {rushOverLimit ? (
                  <p className="text-sm font-semibold text-navy">
                    Em 1 dia útil produzimos até {rushRule.maxQuantity} peças.
                    Para {quantity} unidades o prazo precisa ser combinado no
                    WhatsApp — mandamos a data real antes de fechar.
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-navy">
                    Produção urgente tem acréscimo de{" "}
                    {Math.round(rushRule.pct * 100)}%, já incluído na
                    estimativa. Vale para até {rushRule.maxQuantity} peças, com
                    a arte aprovada no mesmo dia.
                  </p>
                )}
              </div>
            ) : null}

            <div>
              <span className="field-label">Como está a arte?</span>
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
              {hasArt === "tenho-arte" ? (
                <div className="mt-3 flex items-start gap-3 rounded-2xl border-[3px] border-navy bg-yellow/40 p-4">
                  <Paperclip className="mt-0.5 size-5 shrink-0" />
                  <p className="text-sm font-semibold text-navy">
                    Perfeito! Assim que enviar o pedido, o WhatsApp abre com
                    tudo preenchido —{" "}
                    <span className="underline decoration-magenta decoration-2">
                      é só anexar o arquivo lá na conversa
                    </span>
                    . Aceitamos PNG, JPG, PDF ou AI em boa resolução (mínimo
                    1000×1000 px).
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label className="field-label" htmlFor="message">
                Conta pra gente a ideia
              </label>
              <textarea
                id="message"
                rows={5}
                className="field resize-y"
                placeholder="Ex: uma caneca branca com a foto do meu cachorro e a frase 'melhor amigo', para presentear no aniversário."
                {...register("message", { required: true, minLength: 5 })}
              />
              {errors.message ? (
                <span className="mt-1 block text-xs font-semibold text-magenta">
                  Descreva o pedido com pelo menos 5 caracteres.
                </span>
              ) : null}
              {hasArt === "tenho-arte" ? null : (
                <p className="mt-2 text-xs text-navy/55">
                  Tem foto ou arquivo? Manda direto no WhatsApp depois de
                  enviar — o protocolo já vai junto.
                </p>
              )}
            </div>

            <div className="border-t-[3px] border-dashed border-navy/20 pt-8">
              <h2 className="text-2xl">Seus dados</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { key: "pessoal", label: "Sou pessoa física", icon: Users },
                    { key: "empresa", label: "Sou empresa", icon: Building2 },
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

              {clientType === "empresa" ? (
                <div className="mt-4 rounded-2xl border-[3px] border-navy bg-blue/25 p-4">
                  <p className="font-display text-sm font-bold">
                    Pedido corporativo
                  </p>
                  <p className="mt-1 text-sm text-navy/70">
                    Emitimos nota fiscal, enviamos dados para cadastro de
                    fornecedor e aceitamos ordem de compra. A partir de 15 peças
                    o preço por unidade já é de atacado.
                  </p>
                  <Link
                    to="/empresas"
                    className="mt-2 inline-block text-sm font-bold text-magenta underline"
                  >
                    Ver tabela de preço por volume
                  </Link>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

                {clientType === "empresa" ? (
                  <div>
                    <label className="field-label" htmlFor="company">
                      Empresa
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
                ) : null}

                <div>
                  <label className="field-label" htmlFor="phone">
                    WhatsApp
                  </label>
                  <input
                    id="phone"
                    className="field"
                    placeholder="(21) 90000-0000"
                    {...register("phone", { required: true, minLength: 8 })}
                  />
                  {errors.phone ? (
                    <span className="mt-1 block text-xs font-semibold text-magenta">
                      Informe um telefone com DDD.
                    </span>
                  ) : null}
                </div>

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
                  Enviar pedido no WhatsApp
                </>
              )}
            </button>
            <p className="text-center text-xs text-navy/60">
              Sem compromisso. Ao enviar, abrimos o WhatsApp com o seu pedido
              já preenchido — você só confirma o envio.
            </p>
            <p className="text-center text-xs text-navy/50">
              Ao enviar, você concorda que a gente entre em contato pelo
              WhatsApp sobre este orçamento. Seus dados não são
              vendidos nem repassados para propaganda. Veja a{" "}
              <Link
                to="/privacidade"
                className="font-semibold underline hover:text-navy"
              >
                Política de Privacidade
              </Link>
              .
            </p>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="sticker bg-navy p-6 text-cream">
              <span className="tag border-cream/40 bg-cream/10 text-cream">
                Estimativa
              </span>
              <h3 className="mt-4 text-2xl text-cream">Quanto fica?</h3>

              {tiers.isPending ? (
                <p className="mt-4 text-sm text-cream/70">Calculando...</p>
              ) : estimate ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-mint">
                    {estimate.modelName}
                  </p>
                  <p className="mt-1 text-sm text-cream/70">
                    {quantity} {quantity === 1 ? "unidade" : "unidades"} ×{" "}
                    {formatPrice(estimate.tier.unit)}
                  </p>
                  {estimate.rushFee > 0 ? (
                    <p className="mt-1 text-sm text-cream/70">
                      {formatPrice(estimate.subtotal)} + urgência{" "}
                      {Math.round((rushRule?.pct ?? 0) * 100)}% (
                      {formatPrice(estimate.rushFee)})
                    </p>
                  ) : null}
                  <strong className="mt-1 block font-display text-4xl text-yellow">
                    {formatPrice(estimate.total)}
                  </strong>
                  {chosenShipping ? (
                    <p className="mt-2 text-xs text-cream/70">
                      + frete {formatPrice(chosenShipping.price)} ={" "}
                      <strong className="text-cream">
                        {formatPrice(estimate.total + chosenShipping.price)}
                      </strong>
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-cream/60">
                    Faixa {estimate.tier.label}. O valor final depende da arte e
                    do acabamento — confirmamos no WhatsApp.
                  </p>
                  {nextTier ? (
                    <div className="mt-4 rounded-2xl border-[3px] border-yellow/60 bg-yellow/10 p-3">
                      <p className="text-xs font-bold text-yellow">
                        Preço de atacado
                      </p>
                      <p className="mt-1 text-xs text-cream/80">
                        Com {nextTier.min} peças cai para{" "}
                        <strong className="text-cream">
                          {formatPrice(nextTier.unit)}/un
                        </strong>{" "}
                        — economia de {formatPrice(nextTier.save)} por peça.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <button
                          type="button"
                          onClick={() => setValue("quantity", nextTier.min)}
                          className="text-xs font-bold text-yellow underline"
                        >
                          Cotar {nextTier.min} peças
                        </button>
                        <Link
                          to="/empresas"
                          className="text-xs font-bold text-cream/70 underline"
                        >
                          Ver tabela completa
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 text-sm text-cream/70">
                  Preencha o modelo e a quantidade para ver a estimativa.
                </p>
              )}

              {model ? (
                <div className="mt-6 space-y-1.5 border-t border-cream/20 pt-4">
                  <p className="text-xs font-bold tracking-wide text-cream/50 uppercase">
                    Preço por unidade
                  </p>
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

            <div className="sticker bg-white p-6">
              <h3 className="flex items-center gap-2 text-lg">
                <Truck className="size-5 text-magenta" />
                Como você quer receber?
              </h3>
              <p className="mt-1 text-sm text-navy/65">
                Estamos no Rio de Janeiro e enviamos para todo o Brasil.
              </p>

              <div className="mt-3 space-y-2">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setDeliveryMode(option.key)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border-[3px] px-3 py-2 text-left transition",
                      deliveryMode === option.key
                        ? "border-navy bg-mint"
                        : "border-navy/15 bg-cream hover:border-navy/40",
                    )}
                  >
                    <option.icon className="mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="block font-display text-sm font-bold">
                        {option.label}
                      </span>
                      <span className="block text-xs text-navy/65">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {deliveryMode === "motoboy" ? (
                <p className="mt-3 rounded-xl border-[3px] border-navy/15 bg-cream p-3 text-xs text-navy/70">
                  Entregamos na cidade do Rio de Janeiro por motoboy de
                  aplicativo, saindo da nossa produção na Rua José Sombra, 336
                  — Irajá. O valor depende da distância até o seu bairro e é
                  combinado no WhatsApp antes de fechar o pedido.
                </p>
              ) : null}

              {deliveryMode === "retirada" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-navy/65">
                    Retirada é sempre grátis. Onde fica melhor pra você?
                  </p>
                  {pickupPoints.map((point) => (
                    <button
                      key={point.key}
                      type="button"
                      onClick={() => setPickupPoint(point.key)}
                      className={cn(
                        "block w-full rounded-xl border-[3px] px-3 py-2 text-left transition",
                        pickupPoint === point.key
                          ? "border-navy bg-yellow"
                          : "border-navy/15 bg-cream hover:border-navy/40",
                      )}
                    >
                      <span className="block font-display text-sm font-bold">
                        {point.name}
                      </span>
                      <span className="block text-xs text-navy/70">
                        {point.address}
                      </span>
                      <span className="block text-xs text-navy/55">
                        {point.hint}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                className={cn("mt-3 flex gap-2", deliveryMode !== "envio" && "hidden")}
              >
                <input
                  className="field !mt-0"
                  placeholder="Seu CEP"
                  inputMode="numeric"
                  maxLength={9}
                  {...register("cep")}
                />
                <button
                  type="button"
                  onClick={() => void calcShipping()}
                  disabled={shipping.isPending}
                  className="btn btn-navy shrink-0 !px-4"
                >
                  {shipping.isPending ? <Spinner /> : "Calcular"}
                </button>
              </div>

              {deliveryMode === "envio" && shipping.data && !shipping.data.ok ? (
                <p className="mt-3 text-sm font-semibold text-magenta">
                  {shipping.data.message}
                </p>
              ) : null}

              {deliveryMode === "envio" && shippingResult ? (
                <div className="mt-4 space-y-2">
                  {shippingResult.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setShippingPick(option.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border-[3px] px-3 py-2 text-left text-sm transition",
                        chosenShipping?.id === option.id
                          ? "border-navy bg-yellow font-bold"
                          : "border-navy/15 bg-cream hover:border-navy/40",
                      )}
                    >
                      <span>
                        {option.company === option.name
                          ? option.name
                          : `${option.company} · ${option.name}`}
                        <span className="block text-xs font-normal text-navy/60">
                          até {option.deliveryDays} dias úteis
                        </span>
                      </span>
                      <span>{formatPrice(option.price)}</span>
                    </button>
                  ))}
                  {shippingResult.estimated ? (
                    <p className="text-xs text-navy/55">
                      Valores estimados para {shippingResult.region}. O frete
                      exato é confirmado no WhatsApp.
                    </p>
                  ) : (
                    <p className="text-xs text-navy/55">
                      Calculado com peso e caixa médios. O valor final é
                      confirmado no WhatsApp antes de fechar.
                    </p>
                  )}
                  <p className="text-xs text-navy/55">
                    Está no Rio? Motoboy ou retirada em mãos saem mais em conta.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="sticker bg-yellow p-5">
              <h3 className="text-lg">Prefere conversar?</h3>
              <p className="mt-1 text-sm text-navy/75">
                Chama no WhatsApp {site.whatsappDisplay}. {site.hours}.
              </p>
              <a
                className="btn btn-navy mt-4 w-full"
                href={whatsappLink(
                  "Olá! Quero fazer um pedido personalizado na Caneca Maneira.",
                )}
                target="_blank"
                rel="noreferrer"
              >
                Falar agora
              </a>
              <Link
                to="/modelos"
                className="mt-3 block text-center text-sm font-semibold text-navy/70 underline"
              >
                Ver os tipos de caneca
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Prova social onde a decisão acontece: fotos reais logo abaixo do
          formulário, com o caminho para a galeria completa. */}
      <FaixaGaleria
        subtitulo="Fotos reais de pedidos que já entregamos."
        compacta
      />
    </div>
  );
}
