import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Painel interno (Caneca Maneira).
 * Protegido por senha única definida em ADMIN_PASSWORD no .env.
 * Toda procedure recebe a senha e valida no servidor.
 */

function assertPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "ADMIN_PASSWORD não está configurada no servidor.",
    });
  }
  if (password !== expected) {
    throw new ORPCError("UNAUTHORIZED", { message: "Senha incorreta." });
  }
}

const auth = z.object({ password: z.string().min(1) });

export const admin = {
  /** Valida a senha sem devolver dados — usado na tela de login. */
  login: base.input(auth).handler(({ input }) => {
    assertPassword(input.password);
    return { ok: true as const };
  }),

  /** Contadores do topo do painel. */
  summary: base.input(auth).handler(async ({ input }) => {
    assertPassword(input.password);

    const [allQuotes, allOrders] = await Promise.all([
      db.select().from(schema.quotes),
      db.select().from(schema.orders),
    ]);

    const revenue = allOrders
      .filter((order) => order.status !== "cancelado")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      quotesTotal: allQuotes.length,
      quotesNew: allQuotes.filter((quote) => quote.status === "novo").length,
      ordersTotal: allOrders.length,
      ordersWaiting: allOrders.filter((order) => order.status === "aguardando")
        .length,
      revenue,
    };
  }),

  /** Orçamentos, mais recentes primeiro. */
  quotes: base.input(auth).handler(async ({ input }) => {
    assertPassword(input.password);
    return db
      .select()
      .from(schema.quotes)
      .orderBy(desc(schema.quotes.createdAt))
      .limit(300);
  }),

  /** Pedidos da loja com os itens de cada um. */
  orders: base.input(auth).handler(async ({ input }) => {
    assertPassword(input.password);

    const rows = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(300);

    const items = await db.select().from(schema.orderItems);

    return rows.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
    }));
  }),

  /** Atualiza o status de um orçamento. */
  setQuoteStatus: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        status: z.enum(["novo", "respondido", "fechado", "perdido"]),
      }),
    )
    .handler(async ({ input }) => {
      assertPassword(input.password);
      await db
        .update(schema.quotes)
        .set({ status: input.status })
        .where(eq(schema.quotes.id, input.id));
      return { ok: true as const };
    }),

  /** Atualiza o status de um pedido. */
  setOrderStatus: base
    .input(
      auth.extend({
        id: z.number().int().positive(),
        status: z.enum([
          "aguardando",
          "pago",
          "producao",
          "enviado",
          "entregue",
          "cancelado",
        ]),
      }),
    )
    .handler(async ({ input }) => {
      assertPassword(input.password);
      await db
        .update(schema.orders)
        .set({ status: input.status })
        .where(eq(schema.orders.id, input.id));
      return { ok: true as const };
    }),
};
