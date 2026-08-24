import { useEffect, useSyncExternalStore } from "react";
import { Link } from "wouter";
import { Minus, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useConferirSacola } from "../queries/prontos";
import { useSacola } from "../lib/sacola";
import { formatPrice, site } from "../lib/site";
import { gaLead } from "../lib/ga";
import { cn } from "../lib/utils";
import { Spinner } from "./ui/bits";

/**
 * Sacola dos modelos prontos: o cliente junta o que gostou e fecha tudo num
 * WhatsApp só, com código, quantidade e valor de cada peça.
 *
 * A conta é conferida no servidor antes de montar a mensagem, então o que
 * chega para a gente é sempre o preço de hoje.
 */

/* Abre/fecha a gaveta. Fica fora do React porque o botão está no topo e a
   gaveta no fim do layout — dois pontos distantes da árvore. */
let aberta = false;
const ouvintes = new Set<() => void>();

function avisar() {
  for (const ouvinte of ouvintes) ouvinte();
}

export const gaveta = {
  abrir() {
    aberta = true;
    avisar();
  },
  fechar() {
    aberta = false;
    avisar();
  },
};

function useGavetaAberta() {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => ouvintes.delete(ouvinte);
    },
    () => aberta,
    () => false,
  );
}

/** Botão do topo com o contador de peças. Só aparece com item na sacola. */
export function BotaoSacola({ className }: { className?: string }) {
  const { pecas } = useSacola();
  if (pecas === 0) return null;

  return (
    <button
      type="button"
      onClick={gaveta.abrir}
      aria-label={`Abrir sacola: ${pecas} ${pecas === 1 ? "peça" : "peças"}`}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-navy bg-yellow transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <ShoppingBasket className="size-5" strokeWidth={2.5} />
      <span className="absolute -top-1.5 -right-1.5 grid min-w-6 place-items-center rounded-full border-[3px] border-navy bg-magenta px-1 font-display text-xs font-extrabold text-white">
        {pecas > 99 ? "99+" : pecas}
      </span>
    </button>
  );
}

/** Monta a mensagem do WhatsApp com a lista toda. */
function montarMensagem(
  itens: {
    code: string;
    name: string;
    typeName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    soldOut: boolean;
  }[],
  total: number,
) {
  const linhas = itens.map((item) =>
    item.soldOut
      ? `• ${item.code} — ${item.name} (${item.typeName})\n  ${item.quantity}x — esgotado, dá para refazer?`
      : `• ${item.code} — ${item.name} (${item.typeName})\n  ${item.quantity}x ${formatPrice(item.unitPrice)} = ${formatPrice(item.total)}`,
  );

  return [
    "Oi! Separei estes modelos prontos no site:",
    "",
    ...linhas,
    "",
    `Total dos produtos: ${formatPrice(total)}`,
    "",
    "Quero fechar o pedido. Como faço o pagamento e a entrega?",
  ].join("\n");
}

export function GavetaSacola() {
  const visivel = useGavetaAberta();
  const { itens, pecas, definir, remover, limpar } = useSacola();
  const conferida = useConferirSacola(itens);

  // Esc fecha, e com a gaveta aberta a página de trás não rola.
  useEffect(() => {
    if (!visivel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") gaveta.fechar();
    };
    window.addEventListener("keydown", onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [visivel]);

  // Sacola esvaziada com a gaveta aberta: fecha sozinha.
  useEffect(() => {
    if (visivel && pecas === 0) gaveta.fechar();
  }, [visivel, pecas]);

  if (!visivel) return null;

  const dados = conferida.data;
  const lista = dados?.items ?? [];
  const total = dados?.total ?? 0;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button
        type="button"
        aria-label="Fechar sacola"
        onClick={gaveta.fechar}
        className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sacola de modelos prontos"
        className="relative flex h-full w-full max-w-md flex-col border-l-[3px] border-navy bg-cream shadow-[-8px_0_0_rgba(11,44,94,0.12)]"
      >
        <header className="flex items-center justify-between gap-3 border-b-[3px] border-navy bg-yellow px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBasket className="size-5" strokeWidth={2.5} />
            <strong className="font-display text-lg">
              Minha sacola
              <span className="ml-2 text-sm font-semibold text-navy/70">
                {pecas} {pecas === 1 ? "peça" : "peças"}
              </span>
            </strong>
          </div>
          <button
            type="button"
            onClick={gaveta.fechar}
            aria-label="Fechar sacola"
            className="grid size-9 place-items-center rounded-xl border-[3px] border-navy bg-white"
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {conferida.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-navy/65">
              <Spinner /> Conferindo os preços...
            </p>
          ) : null}

          {dados?.indisponiveis.length ? (
            <p className="mb-4 rounded-2xl border-[3px] border-magenta bg-magenta/10 px-4 py-2.5 text-sm font-semibold text-magenta">
              Tirei da sacola {dados.indisponiveis.length}{" "}
              {dados.indisponiveis.length === 1 ? "modelo" : "modelos"} que
              saiu da vitrine.
            </p>
          ) : null}

          <ul className="space-y-3">
            {lista.map((item) => (
              <li
                key={item.slug}
                className="rounded-2xl border-[3px] border-navy bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-display text-xs font-extrabold text-magenta">
                      {item.code}
                    </span>
                    <p className="font-display leading-tight font-bold">
                      {item.name}
                    </p>
                    <p className="text-xs text-navy/60">{item.typeName}</p>
                    {item.soldOut ? (
                      <p className="mt-1 text-xs font-bold text-magenta">
                        Esgotado — a gente confirma no WhatsApp
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Tirar ${item.name} da sacola`}
                    onClick={() => remover(item.slug)}
                    className="grid size-9 shrink-0 place-items-center rounded-xl border-[3px] border-navy bg-cream"
                  >
                    <Trash2 className="size-4" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() => definir(item.slug, item.quantity - 1)}
                      className="grid size-9 place-items-center rounded-xl border-[3px] border-navy bg-cream"
                    >
                      <Minus className="size-4" strokeWidth={3} />
                    </button>
                    <span className="w-8 text-center font-display font-extrabold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() => definir(item.slug, item.quantity + 1)}
                      className="grid size-9 place-items-center rounded-xl border-[3px] border-navy bg-cream"
                    >
                      <Plus className="size-4" strokeWidth={3} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-extrabold">
                      {formatPrice(item.total)}
                    </p>
                    <p className="text-xs text-navy/55">
                      {formatPrice(item.unitPrice)} cada
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={limpar}
            className="mt-4 text-sm font-semibold text-navy/55 underline"
          >
            Esvaziar sacola
          </button>
        </div>

        <footer className="border-t-[3px] border-navy bg-white px-5 py-4">
          <div className="flex items-end justify-between">
            <span className="font-display font-bold">Total dos produtos</span>
            <strong className="font-display text-2xl font-extrabold">
              {formatPrice(total)}
            </strong>
          </div>
          <p className="mt-1 text-xs text-navy/60">
            Entrega e forma de pagamento a gente combina no WhatsApp. Retirada
            na loja do Centro sai sem frete.
          </p>

          <a
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
              montarMensagem(lista, total),
            )}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              gaLead("sacola_prontos", { itens: lista.length, pecas });
              gaveta.fechar();
            }}
            className={cn(
              "btn btn-primary mt-4 w-full",
              lista.length === 0 && "pointer-events-none opacity-50",
            )}
          >
            <FaWhatsapp className="size-5" />
            Fechar pedido no WhatsApp
          </a>

          <Link
            to="/prontos"
            onClick={gaveta.fechar}
            className="mt-2 block text-center text-sm font-semibold text-navy/65 underline"
          >
            Continuar escolhendo modelos
          </Link>
        </footer>
      </aside>
    </div>
  );
}
