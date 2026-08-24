import { tool } from "ai";
import z from "zod";
import { insertQuote } from "../../routes/quotes";
import { site } from "../../../web/lib/site";

/** Só dígitos, para montar o link do WhatsApp. */
function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Grava o pedido na mesma tabela do formulário do site. O atendente só chama
 * isto depois de ter nome, telefone e a descrição do que a pessoa quer.
 */
export const registrarPedido = tool({
  description:
    "Grava o pedido no painel da Caneca Maneira e devolve o número do orçamento. Só use depois de confirmar nome, telefone (com DDD) e o que a pessoa quer. Nunca invente esses dados — pergunte.",
  inputSchema: z.object({
    nome: z.string().min(3).describe("Nome de quem está pedindo."),
    telefone: z.string().min(8).describe("WhatsApp com DDD."),
    tipoCliente: z
      .enum(["pessoal", "empresa"])
      .describe("'empresa' quando é brinde corporativo, evento ou revenda."),
    empresa: z.string().optional(),
    quantidade: z.number().int().min(1).max(100000),
    produto: z
      .string()
      .min(2)
      .describe("Rótulo do produto, ex.: 'Caneca temática'."),
    linha: z.enum(["caneca", "camisa", "azulejo"]).default("caneca"),
    cep: z.string().optional(),
    prazo: z
      .string()
      .optional()
      .describe(
        "Prazo desejado em texto. Nunca registre urgência de 1 dia útil: isso é combinado no WhatsApp.",
      ),
    arte: z
      .enum(["tenho-arte", "tenho-ideia", "preciso-de-ajuda"])
      .describe("Situação da arte do cliente."),
    descricao: z
      .string()
      .min(5)
      .max(2000)
      .describe(
        "Resumo do que o cliente quer, escrito por você a partir da conversa.",
      ),
  }),
  async execute(input) {
    const { code } = await insertQuote({
      name: input.nome,
      phone: input.telefone,
      clientType: input.tipoCliente,
      company: input.empresa ?? null,
      quantity: input.quantidade,
      mugType: input.produto,
      productLine: input.linha,
      cep: input.cep ?? null,
      deadline: input.prazo ?? null,
      hasArt: input.arte,
      message: `[Atendimento pelo chat do site]\n${input.descricao}`,
      origin: "chat",
    });

    const texto = `Oi! Falei com o atendente do site. Meu orçamento é o ${code} — ${input.quantidade}x ${input.produto}.`;
    const digits = onlyDigits(input.telefone);

    return {
      ok: true as const,
      codigo: code,
      linkWhatsapp: `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(texto)}`,
      clienteInformado: digits.length >= 10,
      proximoPasso:
        "Diga o número do orçamento ao cliente e mande ele continuar no WhatsApp pelo link, para o Diego fechar os detalhes e a arte.",
    };
  },
});
