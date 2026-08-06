import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

const shippingOptions = {
  retirada: { label: "Retirar no ateliê", price: 0, eta: "Pronto em 3 dias úteis" },
  economico: { label: "Envio econômico", price: 19.9, eta: "6 a 10 dias úteis" },
  expresso: { label: "Envio expresso", price: 34.9, eta: "2 a 4 dias úteis" },
} as const;

const FREE_SHIPPING_FROM = 199;

function makeCode(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${rand}`;
}

const cartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().int().min(1).max(500),
  colorOption: z.string().nullable().optional(),
  sizeOption: z.string().nullable().optional(),
  customText: z.string().max(300).nullable().optional(),
});

export const checkout = {
  shippingOptions: base.handler(() =>
    Object.entries(shippingOptions).map(([key, value]) => ({
      key,
      ...value,
    })),
  ),

  /** Recalcula preços no servidor a partir dos ids — nunca confia no preço do cliente. */
  quoteCart: base
    .input(
      z.object({
        items: z.array(cartItemSchema),
        shippingMethod: z.enum(["retirada", "economico", "expresso"]),
      }),
    )
    .handler(async ({ input }) => {
      if (input.items.length === 0) {
        return { subtotal: 0, shippingPrice: 0, total: 0, freeShipping: false };
      }
      const ids = input.items.map((i) => i.productId);
      const rows = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, ids));

      const subtotal = input.items.reduce((acc, item) => {
        const product = rows.find((p) => p.id === item.productId);
        return product ? acc + product.price * item.quantity : acc;
      }, 0);

      const freeShipping = subtotal >= FREE_SHIPPING_FROM;
      const base = shippingOptions[input.shippingMethod].price;
      const shippingPrice = freeShipping ? 0 : base;

      return {
        subtotal: Number(subtotal.toFixed(2)),
        shippingPrice,
        total: Number((subtotal + shippingPrice).toFixed(2)),
        freeShipping,
      };
    }),

  createOrder: base
    .input(
      z.object({
        customerName: z.string().min(3),
        customerEmail: z.email(),
        customerPhone: z.string().min(8),
        customerDoc: z.string().optional(),
        zip: z.string().min(5),
        street: z.string().min(3),
        number: z.string().min(1),
        complement: z.string().optional(),
        district: z.string().min(2),
        city: z.string().min(2),
        state: z.string().min(2).max(2),
        shippingMethod: z.enum(["retirada", "economico", "expresso"]),
        paymentMethod: z.enum(["pix", "cartao", "boleto"]),
        notes: z.string().max(1000).optional(),
        items: z.array(cartItemSchema).min(1),
      }),
    )
    .handler(async ({ input }) => {
      const ids = input.items.map((i) => i.productId);
      const rows = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.id, ids));

      if (rows.length === 0) {
        throw new ORPCError("BAD_REQUEST", { message: "Carrinho inválido" });
      }

      const lines = input.items.map((item) => {
        const product = rows.find((p) => p.id === item.productId);
        if (!product) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Uma das canecas do carrinho não existe mais",
          });
        }
        return { item, product };
      });

      const subtotal = lines.reduce(
        (acc, { item, product }) => acc + product.price * item.quantity,
        0,
      );
      const freeShipping = subtotal >= FREE_SHIPPING_FROM;
      const shippingPrice = freeShipping
        ? 0
        : shippingOptions[input.shippingMethod].price;
      const total = Number((subtotal + shippingPrice).toFixed(2));

      const [order] = await db
        .insert(schema.orders)
        .values({
          code: makeCode("CM"),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerDoc: input.customerDoc ?? null,
          zip: input.zip,
          street: input.street,
          number: input.number,
          complement: input.complement ?? null,
          district: input.district,
          city: input.city,
          state: input.state.toUpperCase(),
          shippingMethod: input.shippingMethod,
          shippingPrice,
          paymentMethod: input.paymentMethod,
          subtotal: Number(subtotal.toFixed(2)),
          total,
          notes: input.notes ?? null,
        })
        .returning();

      await db.insert(schema.orderItems).values(
        lines.map(({ item, product }) => ({
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          unitPrice: product.price,
          quantity: item.quantity,
          colorOption: item.colorOption ?? null,
          sizeOption: item.sizeOption ?? null,
          customText: item.customText ?? null,
        })),
      );

      return {
        code: order.code,
        total: order.total,
        subtotal: order.subtotal,
        shippingPrice: order.shippingPrice,
        paymentMethod: order.paymentMethod,
        shippingEta: shippingOptions[input.shippingMethod].eta,
      };
    }),

  orderByCode: base
    .input(z.object({ code: z.string() }))
    .handler(async ({ input }) => {
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.code, input.code.toUpperCase()));
      if (!order) throw new ORPCError("NOT_FOUND", { message: "Pedido não encontrado" });
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));
      return { order, items };
    }),
};
