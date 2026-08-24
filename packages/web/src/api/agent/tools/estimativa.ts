import { tool } from "ai";
import z from "zod";
import { estimateForOption } from "../../routes/quotes";
import { MIN_B2B } from "../../routes/pricing";

/**
 * Estimativa de preço para o atendente de IA.
 *
 * Trava de segurança: `rush` é sempre `false`. O acréscimo de produção urgente
 * e o prazo de 1 dia útil NÃO podem ser prometidos por robô — o cliente é
 * mandado para o WhatsApp. Como o cálculo é feito aqui no servidor, o modelo
 * não tem como burlar isso nem por engano nem se for instruído pelo visitante.
 */
export const calcularEstimativa = tool({
  description:
    "Calcula a estimativa de preço de um produto por quantidade, usando a mesma tabela do site. Use SEMPRE esta ferramenta para qualquer pergunta de preço — nunca calcule de cabeça. Não cobre urgência: se o cliente tem pressa, mande para o WhatsApp.",
  inputSchema: z.object({
    opcao: z
      .string()
      .describe(
        "Rótulo exato do produto, como 'Caneca temática' ou 'Camisa sublimação'. Use listarOpcoesDePreco se não souber.",
      ),
    quantidade: z.number().int().min(1).max(100000),
  }),
  execute({ opcao, quantidade }) {
    const result = estimateForOption(opcao, quantidade, false);

    if (!result) {
      return {
        ok: false as const,
        motivo:
          "Rótulo de produto não reconhecido. Chame listarOpcoesDePreco e tente de novo com um rótulo da lista.",
      };
    }

    return {
      ok: true as const,
      material: result.modelName,
      precoPorUnidade: result.unit,
      faixa: result.tierLabel,
      total: result.total,
      atacado: quantidade >= MIN_B2B,
      minimoAtacado: MIN_B2B,
      aviso:
        "Estimativa, não orçamento fechado. O valor final depende da arte e é confirmado no WhatsApp. Não inclui frete nem urgência.",
    };
  },
});
