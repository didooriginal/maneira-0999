import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { assertPassword } from "../lib/admin-auth";
import { S3_BUCKET, s3 } from "../lib/s3";

/**
 * Upload de foto pelo painel.
 *
 * O arquivo vai do navegador direto para o storage (URL pré-assinada), sem
 * passar pelo servidor. Depois a foto é servida pela rota GET /api/midia/:key,
 * então o site nunca depende de link assinado que expira.
 */

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** A arte final que vai para produção costuma vir em PDF. */
const TIPOS_ARQUIVO = [...TIPOS_IMAGEM, "application/pdf"];
/**
 * Arte digital guardada no painel: além de imagem e PDF, aceita ZIP — é comum
 * a arte vir com o arquivo editável e as fontes no mesmo pacote.
 * O ZIP às vezes chega como `application/x-zip-compressed` (Windows) ou sem
 * tipo nenhum (`application/octet-stream`), então os três entram.
 */
const TIPOS_ARTE = [
  ...TIPOS_ARQUIVO,
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];
const TAMANHO_MAX = 12 * 1024 * 1024; // 12 MB — foto de celular caberia folgado

/** Nome de arquivo seguro: sem acento, sem espaço, sem surpresa. */
function slugifyFilename(filename: string) {
  const parts = filename.split(".");
  const ext = (parts.length > 1 ? parts.pop() : "jpg")!.toLowerCase();
  const base = parts
    .join("-")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .toLowerCase();
  return `${base || "arquivo"}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export const upload = {
  /** Devolve a URL para o navegador enviar o arquivo direto ao storage. */
  presign: base
    .input(
      z.object({
        password: z.string().min(1),
        filename: z.string().min(1),
        contentType: z.string().min(3),
        size: z.number().int().positive().optional(),
        /** Libera PDF além de imagem (usado na arte final do pedido). */
        allowPdf: z.boolean().default(false),
        /** Libera PDF e ZIP (arte digital dos modelos prontos). */
        allowArt: z.boolean().default(false),
      }),
    )
    .handler(async ({ input }) => {
      await assertPassword(input.password);
      const aceitos = input.allowArt
        ? TIPOS_ARTE
        : input.allowPdf
          ? TIPOS_ARQUIVO
          : TIPOS_IMAGEM;
      if (!aceitos.includes(input.contentType)) {
        throw new ORPCError("BAD_REQUEST", {
          message: input.allowArt
            ? "Só aceito imagem (JPG, PNG, WebP, AVIF), PDF ou ZIP."
            : input.allowPdf
              ? "Só aceito imagem (JPG, PNG, WebP, AVIF) ou PDF."
              : "Só aceito imagem JPG, PNG, WebP ou AVIF.",
        });
      }
      // ZIP disfarçado de octet-stream só passa se a extensão for .zip.
      if (
        input.contentType === "application/octet-stream" &&
        !input.filename.toLowerCase().endsWith(".zip")
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Não reconheci esse arquivo. Manda imagem, PDF ou ZIP.",
        });
      }
      if (input.size && input.size > TAMANHO_MAX) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Arquivo muito grande. O limite é 12 MB.",
        });
      }

      // Arte digital fica separada das fotos do site — facilita achar depois.
      const pasta = input.allowArt ? "artes" : "fotos";
      const key = `${pasta}/${Date.now()}-${slugifyFilename(input.filename)}`;

      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          ContentType: input.contentType,
        }),
        { expiresIn: 600 },
      );

      // publicUrl é o que fica salvo no banco e usado no <img> do site.
      return { url, key, publicUrl: `/api/midia/${key}` };
    }),
};
