import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  Coffee,
  Images,
  Lock,
  LogOut,
  MessageSquarePlus,
  MessageSquareQuote,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  ShoppingBasket,
  Star,
  Tags,
  LayoutTemplate,
  Wallet,
} from "lucide-react";
import { useAdminLogin, useAdminSummary } from "../queries/admin";
import { Spinner } from "../components/ui/bits";
import { AbaAvaliacoes } from "../components/painel/aba-avaliacoes";
import { AbaDepoimentos } from "../components/painel/aba-depoimentos";
import { AbaFaixa } from "../components/painel/aba-faixa";
import { AbaGaleria } from "../components/painel/aba-galeria";
import { AbaPedidos } from "../components/painel/aba-pedidos";
import { AbaPopup } from "../components/painel/aba-popup";
import { AbaPrecos } from "../components/painel/aba-precos";
import { AbaProdutos } from "../components/painel/aba-produtos";
import { AbaProntos } from "../components/painel/aba-prontos";
import { AbaTipos } from "../components/painel/aba-tipos";
import { AbaTopo } from "../components/painel/aba-topo";
import { TrocarSenha } from "../components/painel/trocar-senha";
import { cn } from "../lib/utils";
import { useSeo } from "../hooks/use-seo";

const STORAGE_KEY = "caneca-maneira:painel:v1";

const abas = [
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "prontos", label: "Modelos prontos", icon: ShoppingBasket },
  { id: "tipos", label: "Tipos de caneca", icon: Coffee },
  { id: "produtos", label: "Produtos", icon: ShoppingBag },
  { id: "galeria", label: "Galeria", icon: Images },
  { id: "depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
  { id: "avaliacoes", label: "Avaliações", icon: Star },
  { id: "precos", label: "Preços", icon: Tags },
  { id: "faixa", label: "Faixa sazonal", icon: CalendarClock },
  { id: "popup", label: "Popup", icon: MessageSquarePlus },
  { id: "topo", label: "Topo da home", icon: LayoutTemplate },
] as const;

type AbaId = (typeof abas)[number]["id"];

function abaDoHash(): AbaId {
  const hash = window.location.hash.replace("#", "");
  return abas.some((aba) => aba.id === hash) ? (hash as AbaId) : "pedidos";
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
          Área restrita da Caneca Maneira. Aqui você vê os pedidos e edita o
          site: produtos, fotos, depoimentos, preços e campanhas.
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

export default function PainelPage() {
  useSeo({
    title: "Painel interno",
    description: "Área restrita da equipe Caneca Maneira.",
    noindex: true,
  });

  const [password, setPassword] = useState("");
  const [aba, setAba] = useState<AbaId>("pedidos");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) setPassword(saved);
    setAba(abaDoHash());
    const onHash = () => setAba(abaDoHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const queryClient = useQueryClient();
  const summary = useAdminSummary(password);

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

  const parados = summary.data?.quotesStalled ?? 0;

  const cards = [
    {
      icon: ClipboardList,
      color: "bg-yellow",
      label: "Pedidos recebidos",
      value: summary.data ? String(summary.data.quotesTotal) : "—",
      hint: summary.data
        ? parados > 0
          ? `${parados} parado(s) há +48h`
          : `${summary.data.quotesNew} aguardando resposta`
        : "",
    },
    {
      icon: PackageCheck,
      color: "bg-blue",
      label: "Últimos 7 dias",
      value: summary.data ? String(summary.data.quotesLast7d) : "—",
      hint: "novos pedidos na semana",
    },
    {
      icon: Wallet,
      color: "bg-mint",
      label: "Fechados",
      value: summary.data ? String(summary.data.quotesClosed) : "—",
      hint: "pedidos que viraram venda",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="tag bg-yellow">Área restrita</span>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)]">
            Painel{" "}
            <span className="script text-magenta text-[1.15em]">interno</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              void queryClient.invalidateQueries();
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

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="sticker p-3 sm:p-5">
            <span
              className={`grid size-9 place-items-center rounded-xl border-[3px] border-navy sm:size-12 sm:rounded-2xl ${card.color}`}
            >
              <card.icon className="size-4 sm:size-6" strokeWidth={2.5} />
            </span>
            <p className="mt-2 font-display text-2xl font-extrabold sm:mt-4 sm:text-3xl">
              {card.value}
            </p>
            <p className="text-xs font-semibold sm:text-sm">{card.label}</p>
            <p className="mt-1 hidden text-xs text-navy/60 sm:block">
              {card.hint}
            </p>
          </div>
        ))}
      </div>

      <nav
        aria-label="Seções do painel"
        className="mt-10 flex snap-x gap-2 overflow-x-auto pb-2"
      >
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "flex shrink-0 snap-start items-center gap-2 rounded-2xl border-[3px] border-navy px-4 py-2.5 text-sm font-bold transition-transform",
              aba === item.id
                ? "bg-navy text-cream shadow-[3px_3px_0_var(--color-yellow)]"
                : "bg-white hover:-translate-y-0.5",
            )}
            aria-current={aba === item.id ? "page" : undefined}
            onClick={() => {
              setAba(item.id);
              window.location.hash = item.id;
            }}
          >
            <item.icon className="size-4" strokeWidth={2.5} />
            {item.label}
            {/* Bolinha de "tem gente pra cobrar" — o Diego vê ao entrar,
                sem precisar abrir a aba. */}
            {item.id === "pedidos" && parados > 0 ? (
              <span
                className={cn(
                  "rounded-full border-2 border-navy px-2 py-0.5 text-xs font-extrabold",
                  aba === item.id ? "bg-yellow text-navy" : "bg-magenta text-cream",
                )}
                title={`${parados} pedido(s) parado(s) há mais de 48h`}
              >
                {parados}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {aba === "pedidos" ? <AbaPedidos password={password} /> : null}
        {aba === "prontos" ? <AbaProntos password={password} /> : null}
        {aba === "tipos" ? <AbaTipos password={password} /> : null}
        {aba === "produtos" ? <AbaProdutos password={password} /> : null}
        {aba === "galeria" ? <AbaGaleria password={password} /> : null}
        {aba === "depoimentos" ? <AbaDepoimentos password={password} /> : null}
        {aba === "avaliacoes" ? <AbaAvaliacoes password={password} /> : null}
        {aba === "precos" ? <AbaPrecos password={password} /> : null}
        {aba === "faixa" ? <AbaFaixa password={password} /> : null}
        {aba === "popup" ? <AbaPopup password={password} /> : null}
        {aba === "topo" ? <AbaTopo password={password} /> : null}
      </div>

      <TrocarSenha
        password={password}
        onTrocada={(nova) => {
          // Continua logado com a senha nova, sem precisar entrar de novo.
          window.sessionStorage.setItem(STORAGE_KEY, nova);
          setPassword(nova);
          void queryClient.invalidateQueries();
        }}
      />
    </div>
  );
}
