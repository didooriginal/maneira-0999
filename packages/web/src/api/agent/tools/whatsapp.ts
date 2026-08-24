import { tool } from "ai";
import z from "zod";
import { site } from "../../../web/lib/site";

/**
 * Passa a conversa para o WhatsApp já com o contexto escrito, para o Diego
 * não precisar perguntar tudo de novo. Usado tanto quando o atendente não
 * pode responder (urgência, motoboy, desconto especial) quanto no fecho.
 */
export const passarParaWhatsapp = tool({
  description:
    "Gera o link do WhatsApp já com um resumo do que o cliente quer. Use ao fechar o atendimento, e SEMPRE que o assunto for urgência de 1 dia útil, valor de motoboy, desconto fora da tabela, ou qualquer coisa que você não pode confirmar.",
  inputSchema: z.object({
    resumo: z
      .string()
      .min(5)
      .max(400)
      .describe(
        "Resumo em primeira pessoa, como se o cliente escrevesse. Ex.: 'Quero 40 canecas coloridas com o logo da empresa para o Natal'.",
      ),
  }),
  execute({ resumo }) {
    return {
      linkWhatsapp: `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(resumo)}`,
      numeroVisivel: site.whatsappDisplay,
      horario: site.hours,
    };
  },
});
