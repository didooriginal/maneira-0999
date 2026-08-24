import { lazy, Suspense, useState } from "react";
import { MessageCircle } from "lucide-react";
import { gaEvent } from "../lib/ga";

/**
 * O painel de conversa carrega o SDK de IA inteiro. Deixar isso no bundle
 * principal fazia todo mundo baixar ~400 kB só pra ver a home — inclusive
 * quem nunca abre o chat.
 *
 * Aqui fica só o botão (leve). O painel é baixado no primeiro clique.
 */
const ChatPanel = lazy(() =>
  import("./chat-widget").then((m) => ({ default: m.ChatPanel })),
);

/** Balãozinho de "carregando" no lugar do painel enquanto o pedaço baixa. */
function Abrindo() {
  return (
    <div className="fixed right-3 bottom-20 left-3 z-[70] flex items-center gap-3 rounded-3xl border-[3px] border-navy bg-cream px-4 py-5 shadow-[6px_6px_0_var(--color-navy)] sm:left-auto sm:w-[24rem]">
      <span className="size-5 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
      <span className="font-display font-extrabold text-navy">
        Abrindo o atendente...
      </span>
    </div>
  );
}

export function ChatLauncher() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => {
          setAberto(true);
          gaEvent("abrir_chat_ia", { page_path: window.location.pathname });
        }}
        /* Pré-carrega o painel quando o mouse encosta no botão: quando o
           clique chega, o arquivo normalmente já está no cache. */
        onMouseEnter={() => void import("./chat-widget")}
        onTouchStart={() => void import("./chat-widget")}
        aria-label="Falar com o atendente do site"
        /* Empilhado acima do botão do WhatsApp (bottom-20), que por sua vez já
           está acima do selo da plataforma no rodapé. */
        className="fixed right-5 bottom-40 z-[60] flex items-center gap-2 rounded-full border-[3px] border-navy bg-magenta px-4 py-3 font-display font-extrabold text-cream shadow-[4px_4px_0_var(--color-navy)] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--color-navy)]"
      >
        <MessageCircle className="size-6" />
        <span className="hidden sm:inline">Tirar dúvida</span>
      </button>
    );
  }

  return (
    <Suspense fallback={<Abrindo />}>
      <ChatPanel onClose={() => setAberto(false)} />
    </Suspense>
  );
}
