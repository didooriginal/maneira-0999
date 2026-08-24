/**
 * Aviso de pedido novo no WhatsApp da equipe, via CallMeBot.
 *
 * O CallMeBot só entrega mensagem para o número que autorizou o robô, então
 * cada pessoa da equipe tem a própria APIKEY. Configure no .env assim:
 *
 *   WHATSAPP_ALERT_RECIPIENTS="5521995777108:123456,5521999999999:654321"
 *
 * Formato de cada item: <telefone com DDI, só dígitos>:<apikey>
 *
 * Regra de ouro: avisar NUNCA pode derrubar a gravação do orçamento. Se o
 * CallMeBot estiver fora do ar, o pedido continua salvo no painel.
 */

const ENDPOINT = "https://api.callmebot.com/whatsapp.php";

type Recipient = { phone: string; apikey: string };

function recipients(): Recipient[] {
  const raw = process.env.WHATSAPP_ALERT_RECIPIENTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [phone, apikey] = entry.split(":");
      return { phone: (phone ?? "").replace(/\D/g, ""), apikey: (apikey ?? "").trim() };
    })
    .filter((r) => r.phone.length >= 10 && r.apikey.length > 0);
}

async function sendTo(recipient: Recipient, text: string) {
  const url = `${ENDPOINT}?phone=%2B${recipient.phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(recipient.apikey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error(
        `[whatsapp-alert] falha para ...${recipient.phone.slice(-4)}: HTTP ${res.status}`,
      );
    }
  } catch (error) {
    console.error(
      `[whatsapp-alert] erro para ...${recipient.phone.slice(-4)}:`,
      error instanceof Error ? error.message : error,
    );
  } finally {
    clearTimeout(timer);
  }
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export type QuoteAlert = {
  code: string;
  name: string;
  phone: string;
  clientType: "pessoal" | "empresa";
  company?: string | null;
  quantity: number;
  mugType: string;
  productLine?: "caneca" | "camisa" | "azulejo";
  cep?: string | null;
  shippingChoice?: string | null;
  deadline?: string | null;
  hasArt: "tenho-arte" | "tenho-ideia" | "preciso-de-ajuda";
  message: string;
  origin: "formulario" | "chat";
  estimateTotal?: number | null;
};

const ART_LABEL: Record<QuoteAlert["hasArt"], string> = {
  "tenho-arte": "Já tem a arte",
  "tenho-ideia": "Tem a ideia, precisa de ajuda pra montar",
  "preciso-de-ajuda": "Precisa que a gente crie a arte",
};

const LINE_LABEL: Record<string, string> = {
  caneca: "Canecas",
  camisa: "Camisas",
  azulejo: "Azulejos",
};

export function buildMessage(quote: QuoteAlert) {
  const digits = quote.phone.replace(/\D/g, "");
  const waNumber = digits.length <= 11 ? `55${digits}` : digits;
  const line = LINE_LABEL[quote.productLine ?? "caneca"] ?? "Canecas";
  const origin =
    quote.origin === "chat"
      ? "Atendente do site (chat)"
      : "Formulário do site";

  const rows = [
    `*Pedido novo — ${quote.code}*`,
    "",
    `👤 ${quote.name}${quote.company ? ` (${quote.company})` : ""}`,
    `📱 ${quote.phone}`,
    `🎯 ${quote.clientType === "empresa" ? "Empresa" : "Pessoa física"} · ${line}`,
    `📦 ${quote.quantity} un · ${quote.mugType}`,
  ];

  if (quote.estimateTotal != null) {
    rows.push(`💰 Estimativa: ${BRL.format(quote.estimateTotal)}`);
  }
  if (quote.deadline) rows.push(`⏱️ Prazo pedido: ${quote.deadline}`);
  if (quote.cep) {
    rows.push(`🚚 CEP ${quote.cep}${quote.shippingChoice ? ` · ${quote.shippingChoice}` : ""}`);
  }
  rows.push(`🎨 ${ART_LABEL[quote.hasArt]}`);
  rows.push("");
  rows.push(`💬 ${quote.message.slice(0, 700)}`);
  rows.push("");
  rows.push(`Responder: wa.me/${waNumber}`);
  rows.push(`Origem: ${origin}`);

  return rows.join("\n");
}

/**
 * Dispara o aviso para todos os números configurados. Não lança erro e não
 * precisa de await — chame como efeito colateral.
 */
export function notifyNewQuote(quote: QuoteAlert) {
  const list = recipients();
  if (list.length === 0) return;
  const text = buildMessage(quote);
  for (const recipient of list) {
    void sendTo(recipient, text);
  }
}
