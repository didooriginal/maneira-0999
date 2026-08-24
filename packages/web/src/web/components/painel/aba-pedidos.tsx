import { useMemo, useState } from "react";
import {
  AlarmClock,
  Check,
  ExternalLink,
  Phone,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  useAdminQuotes,
  useAdminSummary,
  useNudgeQuote,
  useRemoveQuote,
  useSetQuoteFinalArt,
  useSetQuoteStatus,
} from "../../queries/admin";
import {
  DIAS_DE_SILENCIO_APOS_CUTUCAR,
  HORAS_PARA_PARADO,
  estaParado,
  mensagemDeCobranca,
  rotuloDeIdade,
} from "../../lib/parados";
import { whatsappLink } from "../../lib/site";
import { cn } from "../../lib/utils";
import { Aviso, mensagemDeErro } from "./bits";
import { UploadFoto } from "./upload-foto";

const quoteStatuses = ["novo", "respondido", "fechado", "perdido"] as const;

type Status = (typeof quoteStatuses)[number];

const statusTone: Record<string, string> = {
  novo: "bg-yellow",
  respondido: "bg-blue",
  fechado: "bg-mint",
  perdido: "bg-navy/15",
};

const artLabels: Record<string, string> = {
  "tenho-arte": "Já tem a arte",
  "tenho-ideia": "Tem a ideia",
  "preciso-de-ajuda": "Precisa de ajuda",
};

const periodos = [
  { id: "todos", label: "Qualquer data", dias: 0 },
  { id: "7", label: "Últimos 7 dias", dias: 7 },
  { id: "30", label: "Últimos 30 dias", dias: 30 },
  { id: "90", label: "Últimos 3 meses", dias: 90 },
] as const;

type PeriodoId = (typeof periodos)[number]["id"];

const linhas = ["todas", "caneca", "camisa", "azulejo"] as const;

function formatDate(value: Date | string | number) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** (21) 97549-8978 a partir de qualquer formato que o cliente digitou. */
function formatPhone(value: string) {
  const d = onlyDigits(value).replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

/** Monta o link de WhatsApp para responder o cliente direto do painel. */
function clientWhatsapp(phone: string, message: string) {
  const digits = onlyDigits(phone);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function telLink(phone: string) {
  const digits = onlyDigits(phone);
  return `tel:+${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function StatusPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: Status) => void;
  disabled: boolean;
}) {
  return (
    <select
      className="field !w-auto !py-1.5 !text-sm capitalize"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Status)}
    >
      {quoteStatuses.map((option) => (
        <option key={option} value={option} className="capitalize">
          {option}
        </option>
      ))}
    </select>
  );
}

/** Botão-pílula dos filtros, com contador. */
function Chip({
  ativo,
  onClick,
  children,
  contador,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  contador?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border-[3px] border-navy px-3.5 py-1.5 text-sm font-bold capitalize transition-transform",
        ativo
          ? "bg-navy text-cream shadow-[3px_3px_0_var(--color-yellow)]"
          : "bg-white hover:-translate-y-0.5",
      )}
    >
      {children}
      {contador === undefined ? null : (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            ativo ? "bg-cream/25" : "bg-cream",
          )}
        >
          {contador}
        </span>
      )}
    </button>
  );
}

export function AbaPedidos({ password }: { password: string }) {
  const summary = useAdminSummary(password);
  const quotes = useAdminQuotes(password);
  const setQuoteStatus = useSetQuoteStatus();
  const nudgeQuote = useNudgeQuote();
  const setFinalArt = useSetQuoteFinalArt();
  const removeQuote = useRemoveQuote();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | Status | "parados">("todos");
  const [periodo, setPeriodo] = useState<PeriodoId>("todos");
  const [linha, setLinha] = useState<(typeof linhas)[number]>("todas");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  const term = search.trim().toLowerCase();
  const todos = quotes.data ?? [];

  const contagem = useMemo(() => {
    const mapa: Record<string, number> = { todos: todos.length };
    for (const s of quoteStatuses) {
      mapa[s] = todos.filter((quote) => quote.status === s).length;
    }
    mapa.parados = todos.filter((quote) => estaParado(quote)).length;
    return mapa;
  }, [todos]);

  /* A fila de cobrança: quem pediu, não fechou e não foi cutucado ainda.
     Mais velho primeiro — quanto mais tempo passa, mais frio fica o lead. */
  const parados = useMemo(
    () =>
      todos
        .filter((quote) => estaParado(quote))
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
    [todos],
  );

  const filtrados = useMemo(() => {
    const dias = periodos.find((item) => item.id === periodo)?.dias ?? 0;
    const limite = dias ? Date.now() - dias * 864e5 : 0;

    return todos.filter((quote) => {
      if (status === "parados") {
        if (!estaParado(quote)) return false;
      } else if (status !== "todos" && quote.status !== status) {
        return false;
      }
      if (linha !== "todas" && quote.productLine !== linha) return false;
      if (limite && new Date(quote.createdAt).getTime() < limite) return false;
      if (!term) return true;
      return [
        quote.code,
        quote.name,
        quote.company,
        quote.phone,
        quote.productLine,
        quote.mugType,
        quote.message,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [todos, status, periodo, linha, term]);

  async function recarregar() {
    await quotes.refetch();
    await summary.refetch();
  }

  async function salvarArte(id: number, url: string | null) {
    setAviso(null);
    try {
      await setFinalArt.mutateAsync({ password, id, finalArtUrl: url });
      await recarregar();
      setAviso({
        tipo: "ok",
        texto: url
          ? "Arte final guardada no pedido."
          : "Arte final removida do pedido.",
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  /**
   * Abre o WhatsApp com a cobrança pronta e registra que cutucou. A janela é
   * aberta ANTES do await de propósito: navegador só deixa abrir aba nova
   * dentro do clique — se esperar a resposta do servidor, vira popup bloqueado.
   */
  async function cutucar(quote: {
    id: number;
    code: string;
    name: string;
    phone: string;
    quantity: number;
    mugType: string;
    productLine: string;
  }) {
    window.open(
      clientWhatsapp(quote.phone, mensagemDeCobranca(quote)),
      "_blank",
      "noopener,noreferrer",
    );
    setAviso(null);
    try {
      await nudgeQuote.mutateAsync({ password, id: quote.id });
      await recarregar();
      setAviso({
        tipo: "ok",
        texto: `Cutucada anotada — ${quote.name} sai da fila por ${DIAS_DE_SILENCIO_APOS_CUTUCAR} dias.`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  /** Desfaz a marcação de cutucada (clique sem querer). */
  async function desfazerCutucada(id: number) {
    setAviso(null);
    try {
      await nudgeQuote.mutateAsync({ password, id, undo: true });
      await recarregar();
      setAviso({ tipo: "ok", texto: "Cutucada desfeita." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  /** Marca como perdido direto da fila, sem abrir o pedido inteiro. */
  async function marcarPerdido(quote: { id: number; name: string }) {
    setAviso(null);
    try {
      await setQuoteStatus.mutateAsync({
        password,
        id: quote.id,
        status: "perdido",
      });
      await recarregar();
      setAviso({ tipo: "ok", texto: `${quote.name} marcado como perdido.` });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function apagar(quote: { id: number; code: string; name: string }) {
    if (
      !window.confirm(
        `Apagar o pedido ${quote.code} de ${quote.name}? Isso não tem volta.`,
      )
    ) {
      return;
    }
    setAviso(null);
    try {
      await removeQuote.mutateAsync({ password, id: quote.id });
      await recarregar();
      setAviso({ tipo: "ok", texto: `Pedido ${quote.code} apagado.` });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  const limpouTudo =
    status === "todos" && periodo === "todos" && linha === "todas" && !term;

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-extrabold">
          Pedidos recebidos
        </h2>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-navy/50" />
          <input
            className="field !pl-11"
            placeholder="Buscar por código, nome, WhatsApp..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Fila de cobrança — só aparece quando tem alguém pra cutucar */}
      {parados.length === 0 ? null : (
        <div className="mt-5 rounded-3xl border-[3px] border-navy bg-yellow p-5 shadow-[5px_5px_0_var(--color-navy)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-[3px] border-navy bg-cream">
              <AlarmClock className="size-5" strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="font-display text-xl font-extrabold">
                Cobrar hoje · {parados.length}{" "}
                {parados.length === 1 ? "pessoa" : "pessoas"}
              </h3>
              <p className="text-sm text-navy/70">
                Pediram orçamento há mais de {HORAS_PARA_PARADO}h e a conversa
                não andou. Um "oi, ainda quer?" recupera boa parte.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {parados.map((quote) => (
              <li
                key={quote.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-[3px] border-navy bg-cream px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-extrabold">
                    {quote.name}
                    {quote.company ? (
                      <span className="font-sans text-sm font-normal text-navy/60">
                        {" "}
                        · {quote.company}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-navy/60">
                    {quote.code} · chegou {rotuloDeIdade(quote)} ·{" "}
                    {quote.quantity}x {quote.mugType} ·{" "}
                    <span className="capitalize">{quote.status}</span>
                    {quote.nudgedAt
                      ? ` · já cutucado em ${formatDate(quote.nudgedAt)}`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary !px-3 !py-1.5 !text-sm"
                    disabled={nudgeQuote.isPending}
                    onClick={() => void cutucar(quote)}
                  >
                    <FaWhatsapp className="size-4" />
                    Cutucar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !bg-white !px-3 !py-1.5 !text-sm"
                    disabled={nudgeQuote.isPending}
                    title="Tirar da fila sem mandar mensagem agora"
                    onClick={() => void nudgeQuote
                      .mutateAsync({ password, id: quote.id })
                      .then(recarregar)}
                  >
                    <Check className="size-4" />
                    Já falei
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !bg-white !px-3 !py-1.5 !text-sm"
                    disabled={setQuoteStatus.isPending}
                    onClick={() => void marcarPerdido(quote)}
                  >
                    <X className="size-4" />
                    Perdido
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-navy/60">
            Depois de cutucar, o nome some daqui por{" "}
            {DIAS_DE_SILENCIO_APOS_CUTUCAR} dias. Quem vira "fechado" ou
            "perdido" não volta mais.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="mt-5 space-y-3">
        <div className="flex snap-x gap-2 overflow-x-auto pb-1">
          <Chip
            ativo={status === "todos"}
            contador={contagem.todos}
            onClick={() => setStatus("todos")}
          >
            Todos
          </Chip>
          {quoteStatuses.map((item) => (
            <Chip
              key={item}
              ativo={status === item}
              contador={contagem[item]}
              onClick={() => setStatus(item)}
            >
              {item}
            </Chip>
          ))}
          <Chip
            ativo={status === "parados"}
            contador={contagem.parados}
            onClick={() => setStatus("parados")}
          >
            <AlarmClock className="size-4" strokeWidth={2.5} />
            parados
          </Chip>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field !w-auto !py-2 !text-sm"
            aria-label="Filtrar por período"
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value as PeriodoId)}
          >
            {periodos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className="field !w-auto !py-2 !text-sm capitalize"
            aria-label="Filtrar por linha de produto"
            value={linha}
            onChange={(event) =>
              setLinha(event.target.value as (typeof linhas)[number])
            }
          >
            {linhas.map((item) => (
              <option key={item} value={item} className="capitalize">
                {item === "todas" ? "Todas as linhas" : item}
              </option>
            ))}
          </select>

          {limpouTudo ? null : (
            <button
              type="button"
              className="btn btn-ghost !px-3 !py-2 !text-sm"
              onClick={() => {
                setStatus("todos");
                setPeriodo("todos");
                setLinha("todas");
                setSearch("");
              }}
            >
              <X className="size-4" /> Limpar filtros
            </button>
          )}

          <span className="text-xs text-navy/60">
            Mostrando {filtrados.length} de {todos.length}
          </span>
        </div>
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <div className="mt-6 space-y-4">
        {quotes.isLoading ? (
          <p className="text-navy/60">Carregando pedidos...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-navy/60">
            {todos.length === 0
              ? "Nenhum pedido por aqui ainda."
              : "Nenhum pedido bate com esse filtro."}
          </p>
        ) : (
          filtrados.map((quote) => (
            <article key={quote.id} className="sticker p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-display text-lg">
                      {quote.name}
                    </strong>
                    {quote.company ? (
                      <span className="tag bg-cream">{quote.company}</span>
                    ) : null}
                    <span
                      className={cn("tag capitalize", statusTone[quote.status])}
                    >
                      {quote.status}
                    </span>
                    {quote.finalArtUrl ? (
                      <span className="tag bg-mint">Arte final anexada</span>
                    ) : null}
                    {quote.nudgedAt ? (
                      <span className="tag bg-yellow gap-1">
                        <AlarmClock className="size-3.5" strokeWidth={2.5} />
                        cutucado {formatDate(quote.nudgedAt)}
                        <button
                          type="button"
                          aria-label="Desfazer cutucada"
                          title="Desfazer cutucada"
                          className="ml-1 grid size-4 place-items-center rounded-full hover:bg-navy/15"
                          disabled={nudgeQuote.isPending}
                          onClick={() => void desfazerCutucada(quote.id)}
                        >
                          <Undo2 className="size-3" strokeWidth={2.5} />
                        </button>
                      </span>
                    ) : null}
                    {estaParado(quote) ? (
                      <span className="tag bg-magenta text-cream">
                        parado {rotuloDeIdade(quote)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-navy/60">
                    {quote.code} · {formatDate(quote.createdAt)} ·{" "}
                    {quote.clientType === "empresa" ? "Empresa" : "Pessoal"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusPicker
                    value={quote.status}
                    disabled={setQuoteStatus.isPending}
                    onChange={async (next) => {
                      await setQuoteStatus.mutateAsync({
                        password,
                        id: quote.id,
                        status: next,
                      });
                      await recarregar();
                    }}
                  />
                  <a
                    className="btn btn-primary !px-4 !py-2 !text-sm"
                    href={clientWhatsapp(
                      quote.phone,
                      `Olá, ${quote.name}! Aqui é da Caneca Maneira, sobre o seu pedido ${quote.code}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaWhatsapp className="size-4" />
                    Responder
                  </a>
                </div>
              </div>

              {/* Contato: um toque para WhatsApp, outro para ligar */}
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-[3px] border-dashed border-navy/25 bg-cream p-3">
                <span className="text-xs font-bold text-navy/60">Contato</span>
                <a
                  className="btn btn-ghost !bg-white !px-3 !py-1.5 !text-sm"
                  href={clientWhatsapp(
                    quote.phone,
                    `Olá, ${quote.name}! Aqui é da Caneca Maneira, sobre o seu pedido ${quote.code}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaWhatsapp className="size-4" />
                  {formatPhone(quote.phone)}
                </a>
                <a
                  className="btn btn-ghost !bg-white !px-3 !py-1.5 !text-sm"
                  href={telLink(quote.phone)}
                >
                  <Phone className="size-4" /> Ligar
                </a>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-navy/55">Linha</dt>
                  <dd className="font-semibold capitalize">
                    {quote.productLine}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/55">Produto</dt>
                  <dd className="font-semibold">{quote.mugType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/55">Quantidade</dt>
                  <dd className="font-semibold">{quote.quantity}</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/55">Prazo</dt>
                  <dd className="font-semibold">{quote.deadline ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/55">Arte</dt>
                  <dd className="font-semibold">
                    {artLabels[quote.hasArt] ?? quote.hasArt}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-navy/55">CEP</dt>
                  <dd className="font-semibold">{quote.cep ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-xs text-navy/55">Entrega escolhida</dt>
                  <dd className="font-semibold">{quote.shippingChoice ?? "—"}</dd>
                </div>
              </dl>

              <p className="mt-4 rounded-2xl border-[3px] border-dashed border-navy/25 bg-cream p-4 text-sm">
                {quote.message}
              </p>

              {/* Arte final aprovada */}
              <div className="mt-4 rounded-2xl border-[3px] border-navy/15 p-4">
                <UploadFoto
                  password={password}
                  label="Arte final aprovada"
                  aceitaPdf
                  atual={quote.finalArtUrl ?? null}
                  onEnviado={(url) => void salvarArte(quote.id, url)}
                />
                <p className="mt-2 text-xs text-navy/55">
                  Guarde aqui a arte que foi para produção. Fica junto do pedido,
                  fácil de achar se o cliente pedir de novo.
                </p>
                {quote.finalArtUrl ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      className="btn btn-ghost !px-3 !py-1.5 !text-sm"
                      href={quote.finalArtUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" /> Abrir arte
                    </a>
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-1.5 !text-sm"
                      disabled={setFinalArt.isPending}
                      onClick={() => void salvarArte(quote.id, null)}
                    >
                      <X className="size-4" /> Tirar arte
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-1.5 !text-sm"
                  disabled={removeQuote.isPending}
                  onClick={() => void apagar(quote)}
                >
                  <Trash2 className="size-4" /> Apagar pedido
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <p className="mt-10 text-xs text-navy/50">
        Precisa falar com um cliente fora daqui? Use o WhatsApp da loja:{" "}
        <a
          className="underline"
          href={whatsappLink("Olá!")}
          target="_blank"
          rel="noreferrer"
        >
          abrir conversa
        </a>
        .
      </p>
    </section>
  );
}
