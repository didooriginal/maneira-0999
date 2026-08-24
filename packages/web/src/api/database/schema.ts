import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Caneca Maneira — schema
 * Catálogo, pedidos (loja), orçamentos personalizados, depoimentos e galeria.
 */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  emojiIcon: text("emoji_icon"),
  color: text("color").notNull().default("#7FB3DC"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  comparePrice: real("compare_price"),
  image: text("image").notNull(),
  categorySlug: text("category_slug").notNull(),
  badge: text("badge"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  allowsCustomArt: integer("allows_custom_art", { mode: "boolean" })
    .notNull()
    .default(true),
  /** JSON array de strings */
  colorOptions: text("color_options").notNull().default("[]"),
  /** JSON array de strings */
  sizeOptions: text("size_options").notNull().default("[]"),
  /** JSON array de strings */
  highlights: text("highlights").notNull().default("[]"),
  rating: real("rating").notNull().default(5),
  reviewCount: integer("review_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Oculto no site, mas preservado no banco (o painel nunca apaga). */
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerDoc: text("customer_doc"),
  zip: text("zip").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  district: text("district").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  shippingMethod: text("shipping_method").notNull(),
  shippingPrice: real("shipping_price").notNull().default(0),
  paymentMethod: text("payment_method").notNull(),
  subtotal: real("subtotal").notNull(),
  total: real("total").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("aguardando"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  colorOption: text("color_option"),
  sizeOption: text("size_option"),
  customText: text("custom_text"),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  clientType: text("client_type").notNull(),
  company: text("company"),
  quantity: integer("quantity").notNull(),
  mugType: text("mug_type").notNull(),
  /** Linha de produto: caneca | camisa | azulejo. */
  productLine: text("product_line").notNull().default("caneca"),
  /** CEP informado para o cálculo de frete (opcional). */
  cep: text("cep"),
  /** Frete escolhido no formulário, em texto ("PAC — R$ 27,00"). */
  shippingChoice: text("shipping_choice"),
  deadline: text("deadline"),
  hasArt: text("has_art").notNull(),
  artUrl: text("art_url"),
  /** Arte final aprovada, enviada pelo painel depois do pedido fechado. */
  finalArtUrl: text("final_art_url"),
  message: text("message").notNull(),
  status: text("status").notNull().default("novo"),
  /**
   * Quando o Diego cutucou o cliente pela última vez (follow-up no WhatsApp).
   * Nulo = nunca cutucou. Serve para a lista de "pedidos parados" no painel
   * não ficar repetindo o mesmo nome todo dia.
   */
  nudgedAt: integer("nudged_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  quote: text("quote").notNull(),
  rating: integer("rating").notNull().default(5),
  initials: text("initials").notNull(),
  accent: text("accent").notNull().default("#FFD100"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const galleryItems = sqliteTable("gallery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  tag: text("tag").notNull(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * Preços editados pelo Diego no painel, sobrescrevendo os padrões do código.
 * Só existe linha aqui para o que ele mudou de fato — o resto continua vindo
 * de `priceModels` em routes/pricing.ts. Fonte única: site, orçamentos e a IA
 * leem daqui, então nunca divergem.
 */
export const priceOverrides = sqliteTable("price_overrides", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  modelKey: text("model_key").notNull().unique(),
  retailFrom: real("retail_from"),
  retailTo: real("retail_to"),
  /** JSON: [{ min, max, unit, label }] — a tabela de atacado completa. */
  tiersJson: text("tiers_json"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Faixa sazonal (Dia das Mães, Natal, formatura...). Aparece e desaparece
 * sozinha pelas datas — o Diego agenda e esquece.
 */
export const seasonalBanners = sqliteTable("seasonal_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  emoji: text("emoji"),
  /** Cor de fundo da faixa (token da marca). */
  accent: text("accent").notNull().default("magenta"),
  /** YYYY-MM-DD, comparação por data no fuso de São Paulo. */
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Modelos prontos — a vitrine de /prontos.
 *
 * É arte que já existe pronta: o cliente escolhe, joga na sacola e fecha no
 * WhatsApp. Diferente de `products`, que é a linha de produto (caneca mágica,
 * camisa...) e serve de inspiração para pedido personalizado.
 *
 * `price` nulo = preço automático pela tabela de preços (`product_type`).
 * `art_url` e `internal_note` são internos: nunca saem em rota pública.
 */
export const readyDesigns = sqliteTable("ready_designs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Código curto que o cliente cita no WhatsApp: CM-014. */
  code: text("code").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Chave do modelo na tabela de preços: branca, magica, camisa-total... */
  productType: text("product_type").notNull().default("branca"),
  /** Nulo = usa o preço de varejo da tabela para esse tipo. */
  price: real("price"),
  comparePrice: real("compare_price"),
  category: text("category").notNull().default("outros"),
  /** JSON array de URLs. A primeira é a capa. */
  imagesJson: text("images_json").notNull().default("[]"),
  /** JSON array de strings — termos de busca (Flamengo, gatinho, café...). */
  tagsJson: text("tags_json").notNull().default("[]"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  soldOut: integer("sold_out", { mode: "boolean" }).notNull().default(false),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  /** Só o painel vê: onde achei a arte, fonte usada, detalhe de produção. */
  internalNote: text("internal_note"),
  /** Arquivo da arte digital para estampar (PDF, PNG, JPG ou ZIP). */
  artUrl: text("art_url"),
  artName: text("art_name"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Tipos de caneca — a vitrine de /modelos.
 *
 * Responde a primeira pergunta do cliente: "que caneca vocês têm e quanto
 * custa?". Cada linha é um tipo físico (branca, com colher, de chopp...),
 * não uma arte. A arte pronta mora em `ready_designs`; a foto de trabalho
 * entregue mora em `gallery_items`.
 *
 * `image_printed` é a foto estampada (a que vende) e `image_blank` é a peça
 * crua — o card mostra a estampada e revela a crua no hover/toque.
 *
 * Preço: `price_manual` ganha de tudo; sem ele, o valor sai da tabela de
 * preços pelo `price_model_key`; sem os dois, o card diz "sob consulta".
 */
export const mugTypes = sqliteTable("mug_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** Linha curta embaixo do nome: "Porcelana 325ml, a mais pedida". */
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  /** Foto da peça já estampada — é a capa do card. */
  imagePrinted: text("image_printed").notNull().default(""),
  /** Foto da peça crua, sem estampa. Vazio = card não mostra o "ver crua". */
  imageBlank: text("image_blank").notNull().default(""),
  /** Chave em `priceModels` (branca, colorida, polimero...). Nulo = sem tabela. */
  priceModelKey: text("price_model_key"),
  /** Preço digitado no painel. Ganha da tabela de preços quando preenchido. */
  priceManual: real("price_manual"),
  /** Rótulo do formulário de pedido, para o botão já abrir no tipo certo. */
  quoteOption: text("quote_option"),
  /** JSON array de strings — 2 ou 3 vantagens curtas. */
  highlightsJson: text("highlights_json").notNull().default("[]"),
  badge: text("badge"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Configurações internas em chave/valor. Hoje guarda só o hash da senha do
 * painel (`admin_password_hash`), para o Diego trocar sozinho sem mexer no
 * servidor.
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
