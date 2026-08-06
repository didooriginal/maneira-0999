import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Lock,
  LogOut,
  PackageCheck,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  useAdminLogin,
  useAdminOrders,
  useAdminQuotes,
  useAdminSummary,
  useSetOrderStatus,
  useSetQuoteStatus,
} from "../queries/admin";
import { Spinner } from "../components/ui/bits";
import { formatPrice, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";

const STORAGE_KEY = "caneca-maneira:painel:v1";

const quoteStatuses = ["novo", "respondido", "fechado", "perdido"] as const;
const orderStatuses = [
  "aguardando",
  "pago",
  "producao",
  "enviado",
  "entregue",
  "cancelado",
] as const;

const statusTone: Record<string, string> = {
  novo: "bg-yellow",
  respondido: "bg-blue",
  fechado: "bg-mint",
  perdido: "bg-navy/15",
  aguardando: "bg-yellow",
  pago: "bg-mint",
  producao: "bg-blue",
  enviado: "bg-blue",
  entregue: "bg-mint",
  cancelado: "bg-navy/15",
};

const artLabels: Record<string, string> = {
  "tenho-arte": "Já tem a arte",
  "tenho-ideia": "Tem a ideia",
  "preciso-de-ajuda": "Precisa de ajuda",
};

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

/** Monta o link de WhatsApp para responder o cliente direto do painel. */
function clientWhatsapp(phone: string, message: string) {
  const digits = onlyDigits(phone);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

function Login({ onDone }: { onDone: (password: string) => void }) {
  const login = useAdminLogin();
  const [value, setValue] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await login.mutateAsync({ password: value });
      onDone(value);
    } catch {
      /* erro exibido abaixo */
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-5">
      <form onSubmit={submit} className="sticker w-full p-8">
        <div className="grid size-14 place-items-center rounded-2xl border-[3px] border-navy bg-yellow">
          <Lock className="size-7" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-3xl">Painel interno</h1>
        <p className="mt-2 text-sm text-navy/65">
          Área restrita da Caneca Maneira. Aqui você vê os orçamentos e pedidos
          que chegaram pelo site.
        </p>

        <label htmlFor="password" className="field-label mt-6 block">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className="field"
          autoComplete="current-password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        {login.isError ? (
          <p className="mt-3 text-sm font-semibold text-magenta">
            Senha incorreta. Tenta de novo.
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary mt-6 w-full"
          disabled={login.isPending || value.length === 0}
        >
          {login.isPending ? (
            <>
              <Spinner /> Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </form>
    </div>
  );
}

function StatusPicker({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  return (
    <select
      className="field !w-auto !py-1.5 !text-sm capitalize"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option} className="capitalize">
          {option}
        </option>
      ))}
    </select>
  );
}

export default function PainelPage() {
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"orcamentos" | "pedidos">("orcamentos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) setPassword(saved);
  }, []);

  const summary = useAdminSummary(password);
  const quotes = useAdminQuotes(password);
  const orders = useAdminOrders(password);
  const setQuoteStatus = useSetQuoteStatus();
  const setOrderStatus = useSetOrderStatus();

  const term = search.trim().toLowerCase();

  const filteredQuotes = useMemo(() => {
    if (!quotes.data) return [];
    if (!term) return quotes.data;
    return quotes.data.filter((quote) =>
      [quote.code, quote.name, quote.company, quote.email, quote.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [quotes.data, term]);

  const filteredOrders = useMemo(() => {
    if (!orders.data) return [];
    if (!term) return orders.data;
    return orders.data.filter((order) =>
      [order.code, order.customerName, order.customerEmail, order.customerPhone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [orders.data, term]);

  if (!password) {
    return (
      <Login
        onDone={(value) => {
          window.sessionStorage.setItem(STORAGE_KEY, value);
          setPassword(value);
        }}
      />
    );
  }

  const cards = [
    {
      icon: ClipboardList,
      color: "bg-yellow",
      label: "Orçamentos",
      value: summary.data ? String(summary.data.quotesTotal) : "—",
      hint: summary.data ? `${summary.data.quotesNew} novos` : "",
    },
    {
      icon: PackageCheck,
      color: "bg-blue",
      label: "Pedidos",
      value: summary.data ? String(summary.data.ordersTotal) : "—",
      hint: summary.data ? `${summary.data.ordersWaiting} aguardando` : "",
    },
    {
      icon: Wallet,
      color: "bg-mint",
      label: "Total em pedidos",
      value: summary.data ? formatPrice(summary.data.revenue) : "—",
      hint: "cancelados fora da conta",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="tag bg-yellow">Área restrita</span>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)]">
            Painel <span className="script text-magenta text-[1.15em]">interno</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              void summary.refetch();
              void quotes.refetch();
              void orders.refetch();
            }}
          >
            <RefreshCw className="size-4" />
            Atualizar
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              window.sessionStorage.removeItem(STORAGE_KEY);
              setPassword("");
            }}
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="sticker p-5">
            <span
              className={`grid size-12 place-items-center rounded-2xl border-[3px] border-navy ${card.color}`}
            >
              <card.icon className="size-6" strokeWidth={2.5} />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold">
              {card.value}
            </p>
            <p className="text-sm font-semibold">{card.label}</p>
            <p className="mt-1 text-xs text-navy/60">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(
            [
              ["orcamentos", "Orçamentos"],
              ["pedidos", "Pedidos"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full border-[3px] border-navy px-5 py-2 font-display text-sm font-bold transition",
                tab === key ? "bg-navy text-cream" : "bg-white hover:bg-yellow",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-navy/50" />
          <input
            className="field !pl-11"
            placeholder="Buscar por código, nome, e-mail..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {tab === "orcamentos" ? (
        <div className="mt-6 space-y-4">
          {quotes.isLoading ? (
            <p className="text-navy/60">Carregando orçamentos...</p>
          ) : filteredQuotes.length === 0 ? (
            <p className="text-navy/60">Nenhum orçamento por aqui ainda.</p>
          ) : (
            filteredQuotes.map((quote) => (
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
                      <span className={cn("tag capitalize", statusTone[quote.status])}>
                        {quote.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-navy/60">
                      {quote.code} · {formatDate(quote.createdAt)} ·{" "}
                      {quote.clientType === "empresa" ? "Empresa" : "Pessoal"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPicker
                      value={quote.status}
                      options={quoteStatuses}
                      disabled={setQuoteStatus.isPending}
                      onChange={async (next) => {
                        await setQuoteStatus.mutateAsync({
                          password,
                          id: quote.id,
                          status: next as (typeof quoteStatuses)[number],
                        });
                        void quotes.refetch();
                        void summary.refetch();
                      }}
                    />
                    <a
                      className="btn btn-primary !px-4 !py-2 !text-sm"
                      href={clientWhatsapp(
                        quote.phone,
                        `Olá, ${quote.name}! Aqui é da Caneca Maneira, sobre o seu orçamento ${quote.code}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaWhatsapp className="size-4" />
                      Responder
                    </a>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
                </dl>

                <p className="mt-4 rounded-2xl border-[3px] border-dashed border-navy/25 bg-cream p-4 text-sm">
                  {quote.message}
                </p>

                <p className="mt-3 text-xs text-navy/60">
                  {quote.phone} · {quote.email}
                </p>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.isLoading ? (
            <p className="text-navy/60">Carregando pedidos...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-navy/60">Nenhum pedido por aqui ainda.</p>
          ) : (
            filteredOrders.map((order) => (
              <article key={order.id} className="sticker p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-display text-lg">
                        {order.customerName}
                      </strong>
                      <span className={cn("tag capitalize", statusTone[order.status])}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-navy/60">
                      {order.code} · {formatDate(order.createdAt)} ·{" "}
                      {order.paymentMethod} · {order.shippingMethod}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-display text-xl">
                      {formatPrice(order.total)}
                    </strong>
                    <StatusPicker
                      value={order.status}
                      options={orderStatuses}
                      disabled={setOrderStatus.isPending}
                      onChange={async (next) => {
                        await setOrderStatus.mutateAsync({
                          password,
                          id: order.id,
                          status: next as (typeof orderStatuses)[number],
                        });
                        void orders.refetch();
                        void summary.refetch();
                      }}
                    />
                    <a
                      className="btn btn-primary !px-4 !py-2 !text-sm"
                      href={clientWhatsapp(
                        order.customerPhone,
                        `Olá, ${order.customerName}! Aqui é da Caneca Maneira, sobre o seu pedido ${order.code}.`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaWhatsapp className="size-4" />
                      Falar
                    </a>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border-[3px] border-navy/15 p-2"
                    >
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="size-12 rounded-xl border-[3px] border-navy object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {item.productName}
                        </p>
                        <p className="text-xs text-navy/60">
                          {item.quantity}x {formatPrice(item.unitPrice)}
                          {item.colorOption ? ` · ${item.colorOption}` : ""}
                        </p>
                        {item.customText ? (
                          <p className="text-xs text-magenta">
                            Personalização: {item.customText}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-xs text-navy/65">
                  {order.street}, {order.number}
                  {order.complement ? ` — ${order.complement}` : ""} ·{" "}
                  {order.district} · {order.city}/{order.state} · CEP{" "}
                  {order.zip}
                </p>
                <p className="mt-1 text-xs text-navy/60">
                  {order.customerPhone} · {order.customerEmail}
                </p>
                {order.notes ? (
                  <p className="mt-3 rounded-2xl border-[3px] border-dashed border-navy/25 bg-cream p-3 text-sm">
                    {order.notes}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      )}

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
    </div>
  );
}
