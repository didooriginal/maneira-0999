import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, X } from "lucide-react";
import { gaEvent, gaLead } from "../lib/ga";
import { cn } from "../lib/utils";

/** Texto amigável enquanto a IA usa as calculadoras reais do servidor. */
const toolLabels: Record<string, string> = {
  listarCatalogo: "Olhando os modelos…",
  listarOpcoesDePreco: "Vendo a tabela de preços…",
  calcularEstimativa: "Calculando o valor…",
  calcularFrete: "Cotando o frete…",
  consultarRetirada: "Vendo a retirada na loja…",
  registrarPedido: "Anotando seu pedido…",
  passarParaWhatsapp: "Preparando o WhatsApp…",
};

const sugestoes = [
  "Quanto custa 30 canecas temáticas?",
  "Qual o frete pro CEP 20050-000?",
  "Que caneca combina com Dia dos Pais?",
];

const linkRegex = /(https?:\/\/[^\s)]+)/g;
const ehLink = (v: string) => /^https?:\/\//.test(v);

/** Renderiza o texto do atendente: quebra linhas e transforma URL em link. */
function Texto({ value }: { value: string }) {
  const limpo = value.replace(/\*\*/g, "");
  return (
    <>
      {limpo.split("\n").map((linha, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas de texto puro
        <p key={i} className={cn(linha === "" ? "h-1.5" : "mt-1.5 first:mt-0")}>
          {linha.split(linkRegex).map((pedaco, j) =>
            ehLink(pedaco) ? (
              <a
                // biome-ignore lint/suspicious/noArrayIndexKey: pedaços de texto puro
                key={j}
                href={pedaco}
                target="_blank"
                rel="noreferrer"
                aria-label="Continuar no WhatsApp"
                className="font-bold text-navy underline decoration-magenta decoration-2 underline-offset-2"
              >
                {pedaco.includes("wa.me") ? "continuar no WhatsApp" : pedaco}
              </a>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: pedaços de texto puro
              <span key={j}>{pedaco}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

function Bolha({ message }: { message: UIMessage }) {
  const mine = message.role === "user";
  const textos = message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");

  const rodando = message.parts.find(
    (part) =>
      part.type.startsWith("tool-") &&
      "state" in part &&
      part.state !== "output-available" &&
      part.state !== "output-error",
  );

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border-[3px] border-navy px-3.5 py-2.5 text-[0.94rem] leading-snug shadow-[3px_3px_0_var(--color-navy)]",
          mine ? "bg-yellow text-navy" : "bg-white text-navy",
        )}
      >
        {textos ? <Texto value={textos} /> : null}
        {rodando ? (
          <p className="flex items-center gap-2 font-display text-sm font-bold text-navy/70">
            <span className="size-2 animate-pulse rounded-full bg-magenta" />
            {toolLabels[rodando.type.replace("tool-", "")] ?? "Consultando…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * O painel da conversa. Fica em arquivo separado do botão de propósito: ele
 * carrega o SDK de IA inteiro (uns 400 kB), e quem só quer ver as canecas não
 * precisa baixar isso. O `ChatLauncher` só puxa este pedaço no primeiro
 * clique — veja components/chat-launcher.tsx.
 */
export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const leadsRef = useRef(new Set<string>());

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent/messages" }),
  });

  const busy = status === "streaming" || status === "submitted";

  // Rola pro fim a cada novidade.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* Quando a IA grava o orçamento, isso é um lead de verdade — mesmo peso do
     formulário do site. Dispara uma vez por código. */
  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type !== "tool-registrarPedido") continue;
        if (!("output" in part) || !part.output) continue;
        const out = part.output as { codigo?: string };
        if (!out.codigo || leadsRef.current.has(out.codigo)) continue;
        leadsRef.current.add(out.codigo);
        gaLead("chat_ia", { quote_code: out.codigo });
      }
    }
  }, [messages]);

  function enviar(text: string) {
    const limpo = text.trim();
    if (!limpo || busy) return;
    setInput("");
    gaEvent("mensagem_chat_ia", { page_path: window.location.pathname });
    void sendMessage({ text: limpo });
  }

  return (
    <div className="fixed right-3 bottom-20 left-3 z-[70] flex max-h-[78vh] flex-col overflow-hidden rounded-3xl border-[3px] border-navy bg-cream shadow-[6px_6px_0_var(--color-navy)] sm:left-auto sm:w-[24rem]">
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-navy bg-blue px-4 py-3">
        <div>
          <p className="font-display font-extrabold text-navy leading-tight">
            Atendente da Caneca Maneira
          </p>
          <p className="text-navy/70 text-xs">
            Preço, frete e modelos na hora — o Diego assume no WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar conversa"
          className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-navy bg-cream text-navy transition hover:bg-yellow"
        >
          <X className="size-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-2xl border-[3px] border-navy bg-white px-3.5 py-2.5 text-[0.94rem] text-navy shadow-[3px_3px_0_var(--color-navy)]">
              Oi! Sou o atendente do site. Posso te dizer preço por quantidade,
              cotar o frete pelo seu CEP e já anotar seu pedido. O que você
              quer personalizar?
            </div>
            <div className="flex flex-wrap gap-2">
              {sugestoes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="rounded-full border-2 border-navy bg-mint/40 px-3 py-1.5 text-left text-navy text-xs font-semibold transition hover:bg-mint"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Bolha key={message.id} message={message} />
          ))
        )}
        {status === "submitted" ? (
          <p className="flex items-center gap-2 font-display text-navy/60 text-sm">
            <span className="size-2 animate-pulse rounded-full bg-magenta" />
            Digitando…
          </p>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 border-t-[3px] border-navy bg-white px-3 py-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escreva sua dúvida…"
          aria-label="Sua mensagem"
          className="min-w-0 flex-1 rounded-full border-2 border-navy px-3.5 py-2 text-navy outline-none placeholder:text-navy/40 focus:border-magenta"
        />
        <button
          type="submit"
          disabled={busy || input.trim() === ""}
          aria-label="Enviar mensagem"
          className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-navy bg-magenta text-cream transition hover:bg-navy disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
