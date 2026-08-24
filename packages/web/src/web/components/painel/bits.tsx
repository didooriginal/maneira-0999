import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";

/** Campo de texto com rótulo, no estilo do site. */
export function Campo({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="field-label block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-navy/55">{hint}</span> : null}
    </label>
  );
}

/** Setas para subir/descer item na ordem — funciona bem no celular. */
export function BotoesOrdem({
  onUp,
  onDown,
  disabled,
  primeiro,
  ultimo,
}: {
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
  primeiro: boolean;
  ultimo: boolean;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        aria-label="Subir na ordem"
        className="grid size-9 place-items-center rounded-xl border-[3px] border-navy bg-white disabled:opacity-35"
        disabled={disabled || primeiro}
        onClick={onUp}
      >
        <ChevronUp className="size-4" strokeWidth={3} />
      </button>
      <button
        type="button"
        aria-label="Descer na ordem"
        className="grid size-9 place-items-center rounded-xl border-[3px] border-navy bg-white disabled:opacity-35"
        disabled={disabled || ultimo}
        onClick={onDown}
      >
        <ChevronDown className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
}

/** Aviso de sucesso ou erro logo depois de uma ação. */
export function Aviso({
  tipo,
  children,
}: {
  tipo: "ok" | "erro" | "info";
  children: React.ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "mt-3 rounded-2xl border-[3px] px-4 py-2.5 text-sm font-semibold",
        tipo === "ok" && "border-navy bg-mint/35",
        tipo === "erro" && "border-magenta bg-magenta/12 text-magenta",
        tipo === "info" && "border-dashed border-navy/30 bg-cream font-normal",
      )}
    >
      {children}
    </p>
  );
}

/** Mensagem de erro amigável a partir do que o servidor devolveu. */
export function mensagemDeErro(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message && !message.toLowerCase().includes("fetch")) return message;
  }
  return "Não consegui salvar. Confere a conexão e tenta de novo.";
}

/** Move um item de posição dentro do array, sem alterar o original. */
export function mover<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Reaproveita a formatação de moeda em todas as abas. */
export function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
