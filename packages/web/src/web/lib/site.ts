/** Dados de contato e institucionais da Caneca Maneira. */
export const site = {
  name: "Caneca Maneira",
  tagline: "Brindes e Personalizados",
  slogan: "Personalize do seu jeito",
  instagram: "caneca_maneira_of",
  instagramUrl: "https://instagram.com/caneca_maneira_of",
  whatsapp: "5521975498978",
  whatsappDisplay: "(21) 97549-8978",
  address: "Mercado Popular Uruguaiana — Quadra C, nº 107",
  city: "Rio de Janeiro, RJ",
  hours: "Seg a sáb, 9h às 18h",
  /** Perfil da Empresa no Google (cadastrado no endereço de Irajá). */
  googleProfileUrl: "https://share.google/5xxKQ4pB60SRuqDkh",
  /**
   * Nota do Perfil da Empresa no Google. Atualizar manualmente quando o
   * número de avaliações mudar — o mesmo valor está no JSON-LD do index.html
   * e os dois precisam bater com o que aparece no Google.
   */
  googleRating: 5.0,
  googleReviewCount: 6,
};

/**
 * Pontos de retirada em mãos. O endereço de Irajá é também a produção, de
 * onde o motoboy sai. O complemento (apartamento) não é publicado no site:
 * é passado no WhatsApp depois que o pedido é fechado.
 */
export const pickupPoints = [
  {
    key: "uruguaiana",
    name: "Loja no Centro",
    address: "Mercado Popular Uruguaiana — Quadra C, nº 107",
    hint: "Seg a sáb, 9h às 18h",
  },
  {
    key: "iraja",
    name: "Produção em Irajá",
    address: "Rua José Sombra, 336 — Irajá",
    hint: "Com horário combinado. É daqui que o motoboy sai.",
  },
  {
    key: "combinar",
    name: "Outro ponto",
    address: "A combinar no WhatsApp",
    hint: "Se for mais fácil pra você, a gente vê um meio do caminho.",
  },
] as const;

export type PickupKey = (typeof pickupPoints)[number]["key"];

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(value: number) {
  return brl.format(value);
}

export function installments(value: number, times = 3) {
  return `${times}x de ${brl.format(value / times)} sem juros`;
}

/**
 * Quantidade mínima do mesmo produto para pagar preço de atacado.
 * Fonte única: usada na página /empresas e pelo atendente de IA.
 * Mora aqui (e não em api/routes/pricing) porque o front importa esse valor —
 * importar do módulo de API arrastaria o cliente do banco para o bundle do navegador.
 */
export const MIN_B2B = 15;
