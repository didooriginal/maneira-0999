import { tool } from "ai";
import z from "zod";
import { pickupInfo, quoteShipping } from "../../routes/shipping";

/**
 * Frete pelo CEP, na mesma cotação do Melhor Envio que o site usa.
 *
 * Nota: entrega por motoboy NÃO passa por aqui. O valor do motoboy é
 * combinado no WhatsApp e não pode ser estimado por robô.
 */
export const calcularFrete = tool({
  description:
    "Cota o frete dos Correios/transportadoras para um CEP e uma quantidade de peças. Use sempre que perguntarem valor ou prazo de entrega para fora do Rio. NÃO serve para motoboy.",
  inputSchema: z.object({
    cep: z.string().describe("CEP de destino, com ou sem hífen."),
    quantidade: z.number().int().min(1).max(100000),
  }),
  async execute({ cep, quantidade }) {
    const result = await quoteShipping(cep, quantidade);

    if (!result.ok) {
      return { ok: false as const, motivo: result.message };
    }

    return {
      ok: true as const,
      estimado: result.estimated,
      opcoes: result.options.map((option) => ({
        transportadora: option.company,
        servico: option.name,
        preco: option.price,
        prazoDiasUteis: option.deliveryDays,
      })),
      aviso: result.estimated
        ? "Estimativa por região — o valor exato é confirmado no fechamento."
        : "Cotação real das transportadoras. O prazo conta a partir da postagem, depois da produção.",
    };
  },
});

/** Pontos de retirada em mãos, sem custo. */
export const consultarRetirada = tool({
  description:
    "Informa os pontos de retirada em mãos no Rio de Janeiro, sem custo de frete.",
  inputSchema: z.object({}),
  execute() {
    return {
      titulo: pickupInfo.label,
      cidade: pickupInfo.city,
      pontos: pickupInfo.points,
      motoboy:
        "Existe entrega por motoboy no Rio, mas o valor depende do bairro e é combinado no WhatsApp. NUNCA estime esse valor.",
    };
  },
});
