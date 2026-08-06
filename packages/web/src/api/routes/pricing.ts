/**
 * Tabela de preços da Caneca Maneira.
 *
 * `retail` = preço de venda no varejo (1 unidade), usado no catálogo.
 * `tiers` = preço por unidade no atacado, por faixa de quantidade.
 *
 * Fonte: tabela de precificação do cliente (insumo x venda varejo + atacado).
 * Chopp e Crianças são ESTIMATIVAS — não constavam na tabela original.
 */

export interface PriceTier {
  min: number;
  max: number;
  unit: number;
  label: string;
}

export interface PriceModel {
  key: string;
  name: string;
  /** Faixa de varejo divulgada, em texto. */
  retailRange: string;
  retailFrom: number;
  retailTo: number;
  /** Marcado quando o valor é estimado e ainda não foi confirmado. */
  estimated: boolean;
  tiers: PriceTier[];
}

function tiers(
  unit1: number,
  unit15: number,
  unit51: number,
  unit100: number,
  unit500: number,
): PriceTier[] {
  return [
    { min: 1, max: 14, unit: unit1, label: "1 a 14 unidades (varejo)" },
    { min: 15, max: 50, unit: unit15, label: "15 a 50 unidades" },
    { min: 51, max: 99, unit: unit51, label: "51 a 99 unidades" },
    { min: 100, max: 499, unit: unit100, label: "100 a 499 unidades" },
    { min: 500, max: 100000, unit: unit500, label: "500+ unidades" },
  ];
}

export const priceModels: PriceModel[] = [
  {
    key: "branca",
    name: "Porcelana branca padrão 325ml",
    retailRange: "R$ 35,00 a R$ 39,90",
    retailFrom: 35,
    retailTo: 39.9,
    estimated: false,
    tiers: tiers(37.9, 25, 20, 16, 14),
  },
  {
    key: "colorida",
    name: "Cerâmica com alça e interior coloridos",
    retailRange: "R$ 39,80 a R$ 43,70",
    retailFrom: 39.8,
    retailTo: 43.7,
    estimated: false,
    tiers: tiers(43.7, 32, 28, 26, 22),
  },
  {
    key: "glitter",
    name: "Cerâmica com base glitter",
    retailRange: "R$ 47,50 a R$ 65,90",
    retailFrom: 47.5,
    retailTo: 65.9,
    estimated: false,
    tiers: tiers(65.9, 45, 38, 36, 32),
  },
  {
    key: "magica",
    name: "Mágica colorida (revela a imagem)",
    retailRange: "R$ 59,90 a R$ 89,90",
    retailFrom: 59.9,
    retailTo: 89.9,
    estimated: false,
    tiers: tiers(89.9, 55, 45, 42, 38),
  },
  {
    key: "chopp",
    name: "Caneca de chopp",
    retailRange: "R$ 54,90 a R$ 74,90",
    retailFrom: 54.9,
    retailTo: 74.9,
    estimated: true,
    tiers: tiers(69.9, 48, 42, 38, 34),
  },
  {
    key: "criancas",
    name: "Caneca para crianças",
    retailRange: "R$ 34,90 a R$ 39,90",
    retailFrom: 34.9,
    retailTo: 39.9,
    estimated: true,
    tiers: tiers(39.9, 26, 21, 17, 15),
  },
];

/** Rótulos do formulário de orçamento → modelo de preço. */
export const quoteOptionToModel: Record<string, string | null> = {
  "Caneca temática": "branca",
  "Caneca colorida": "colorida",
  "Caneca de chopp": "chopp",
  "Caneca para crianças": "criancas",
  "Caneca mágica": "magica",
  "Caneca glitter": "glitter",
  "Caneca com caricatura": "branca",
  "Caneca com historinha personalizada": "branca",
  "Camisa (sublimação ou DTF)": null,
  "Azulejo personalizado": null,
  "Quadro sublimado": null,
  "Ainda não sei": "branca",
};

export function findTier(modelKey: string, quantity: number) {
  const model = priceModels.find((item) => item.key === modelKey);
  if (!model) return null;
  const tier =
    model.tiers.find((item) => quantity >= item.min && quantity <= item.max) ??
    model.tiers[model.tiers.length - 1];
  return { model, tier };
}
