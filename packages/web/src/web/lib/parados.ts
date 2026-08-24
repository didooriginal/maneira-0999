/**
 * Regra do "pedido parado".
 *
 * Um lead que entrou pelo site e não virou conversa é dinheiro na mesa: a
 * pessoa quis, pediu, e sumiu. Cutucar em 2 ou 3 dias recupera boa parte.
 *
 * Mora aqui (e não dentro do painel) porque o contador do topo do painel e a
 * lista da aba Pedidos precisam usar exatamente o mesmo critério — senão o
 * número diz 3 e a lista mostra 5.
 */

/** Só conta como parado depois desse tempo sem fechar. */
export const HORAS_PARA_PARADO = 48;

/** Depois de cutucar, o pedido some da lista por esse tempo. */
export const DIAS_DE_SILENCIO_APOS_CUTUCAR = 3;

/** Status que ainda estão em aberto — fechado e perdido não voltam à lista. */
export const STATUS_EM_ABERTO = ["novo", "respondido"];

export interface PedidoParaCobrar {
  status: string;
  createdAt: Date | string | number;
  nudgedAt?: Date | string | number | null;
}

/** Está parado? (em aberto, velho o bastante e sem cutucada recente) */
export function estaParado(pedido: PedidoParaCobrar, agora = Date.now()) {
  if (!STATUS_EM_ABERTO.includes(pedido.status)) return false;

  const nascimento = new Date(pedido.createdAt).getTime();
  if (agora - nascimento < HORAS_PARA_PARADO * 36e5) return false;

  if (pedido.nudgedAt) {
    const ultimaCutucada = new Date(pedido.nudgedAt).getTime();
    if (agora - ultimaCutucada < DIAS_DE_SILENCIO_APOS_CUTUCAR * 864e5) {
      return false;
    }
  }

  return true;
}

/** Há quantos dias inteiros esse pedido chegou. */
export function diasParado(pedido: PedidoParaCobrar, agora = Date.now()) {
  return Math.floor((agora - new Date(pedido.createdAt).getTime()) / 864e5);
}

/** "há 3 dias", "ontem", "hoje" — para escrever na tela sem fazer conta. */
export function rotuloDeIdade(pedido: PedidoParaCobrar, agora = Date.now()) {
  const dias = diasParado(pedido, agora);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

/**
 * A mensagem de cobrança pronta, já com o nome da pessoa e o que ela pediu.
 * Tom de gente, sem cara de robô de cobrança: pergunta se ainda quer e abre
 * a porta pra responder com uma palavra só.
 */
export function mensagemDeCobranca(pedido: {
  name: string;
  quantity: number;
  mugType: string;
  productLine?: string;
}) {
  const primeiroNome = pedido.name.trim().split(/\s+/)[0] || "tudo bem";
  const peca = pedido.mugType?.trim() || pedido.productLine || "peça";
  const qtd = pedido.quantity > 1 ? `${pedido.quantity} unidades` : "1 unidade";

  return [
    `Oi, ${primeiroNome}! Aqui é da Caneca Maneira.`,
    `Você pediu um orçamento de ${qtd} de ${peca} pelo nosso site e a gente não quis deixar passar.`,
    "Ainda tem interesse? Se quiser, me manda a ideia (foto, frase ou logo) que eu já faço a arte pra você ver antes de fechar.",
  ].join("\n\n");
}
