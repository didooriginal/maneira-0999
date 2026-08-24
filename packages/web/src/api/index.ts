import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { RouterClient } from "@orpc/server";
import { createAgentUIStreamResponse } from "ai";
import { createApp } from "./__core/app";
import { agent } from "./agent";
import { admin } from "./routes/admin";
import { catalog } from "./routes/catalog";
import { mugTypes } from "./routes/mug-types";
import { quotes } from "./routes/quotes";
import { ready } from "./routes/ready";
import { shipping } from "./routes/shipping";
import { upload } from "./routes/upload";
import { S3_BUCKET, s3 } from "./lib/s3";

export const router = {
  admin,
  catalog,
  mugTypes,
  quotes,
  ready,
  shipping,
  upload,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

/**
 * Chat do atendente virtual. É rota HTTP e não procedure oRPC porque a
 * resposta é um stream.
 */
app.post("/api/agent/messages", async (c) => {
  const { messages } = await c.req.json();
  return createAgentUIStreamResponse({ agent, uiMessages: messages });
});

/**
 * Serve as fotos enviadas pelo painel. O navegador nunca fala com o storage
 * direto na leitura, então o endereço da imagem é estável e cacheável — sem
 * link assinado que expira e quebra a foto no site.
 *
 * Fica embaixo de /api de propósito: em desenvolvimento o Vite só entrega o
 * que começa com /api para o Hono (hono-dev-plugin, arquivo do template que
 * não se mexe). Fora de /api a foto virava a index.html do SPA.
 */
app.get("/api/midia/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/midia\//, "");
  if (!key || key.includes("..")) return c.notFound();

  try {
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    if (!obj.Body) return c.notFound();

    /**
     * `?download=nome-do-arquivo.pdf` faz o navegador baixar em vez de abrir.
     * É o que o painel usa no botão de baixar a arte digital do modelo pronto:
     * o arquivo chega com nome de gente, não com a chave do storage.
     */
    const pedido = c.req.query("download");
    const nome = pedido
      ? pedido.replace(/[^\w.\- ]+/g, "").slice(0, 80) ||
        key.split("/").pop() ||
        "arquivo"
      : null;

    return new Response(obj.Body.transformToWebStream(), {
      headers: {
        "Content-Type": obj.ContentType ?? "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(nome
          ? { "Content-Disposition": `attachment; filename="${nome}"` }
          : {}),
        ...(obj.ETag ? { ETag: obj.ETag } : {}),
      },
    });
  } catch {
    return c.notFound();
  }
});

export default app;
