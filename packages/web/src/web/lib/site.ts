/** Dados de contato e institucionais da Caneca Maneira. */
export const site = {
  name: "Caneca Maneira",
  tagline: "Brindes e Personalizados",
  slogan: "Personalize do seu jeito",
  instagram: "caneca_maneira_of",
  instagramUrl: "https://instagram.com/caneca_maneira_of",
  whatsapp: "5521975498978",
  whatsappDisplay: "(21) 97549-8978",
  email: "contato@canecamaneira.com.br",
  address: "Mercado Popular Uruguaiana — Quadra C, nº 107",
  city: "Rio de Janeiro, RJ",
  hours: "Seg a sáb, 9h às 18h",
};

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
