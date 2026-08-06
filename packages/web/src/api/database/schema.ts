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
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  clientType: text("client_type").notNull(),
  company: text("company"),
  quantity: integer("quantity").notNull(),
  mugType: text("mug_type").notNull(),
  deadline: text("deadline"),
  hasArt: text("has_art").notNull(),
  artUrl: text("art_url"),
  message: text("message").notNull(),
  status: text("status").notNull().default("novo"),
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
