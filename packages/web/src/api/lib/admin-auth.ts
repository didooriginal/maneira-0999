import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Senha do painel.
 *
 * Como funciona:
 * - A senha "de verdade" fica na tabela `settings`, guardada como hash scrypt
 *   (nunca em texto puro). É essa que o Diego troca sozinho pelo painel.
 * - A `ADMIN_PASSWORD` do .env continua valendo como senha de reserva, para o
 *   caso de esquecer a nova e precisar entrar. Só quem tem acesso ao servidor
 *   consegue ver/alterar essa.
 */

const CHAVE = "admin_password_hash";

/** "scrypt:<salt hex>:<hash hex>" — formato guardado no banco. */
function hashSenha(senha: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(senha.normalize("NFKC"), salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function conferirHash(senha: string, guardado: string) {
  const [algoritmo, saltHex, hashHex] = guardado.split(":");
  if (algoritmo !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = scryptSync(
    senha.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    esperado.length,
  );
  return timingSafeEqual(esperado, calculado);
}

/** Comparação constante para a senha de reserva do .env. */
function igualSeguro(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function hashGuardado() {
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, CHAVE))
    .limit(1);
  return rows[0]?.value ?? null;
}

/** true quando o Diego já trocou a senha pelo painel. */
export async function senhaFoiTrocada() {
  return (await hashGuardado()) !== null;
}

/** Valida a senha recebida do painel. Lança UNAUTHORIZED se não bater. */
export async function assertPassword(password: string) {
  const reserva = process.env.ADMIN_PASSWORD;
  const guardado = await hashGuardado();

  if (!guardado && !reserva) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "ADMIN_PASSWORD não está configurada no servidor.",
    });
  }

  if (guardado && conferirHash(password, guardado)) return;
  if (reserva && igualSeguro(password, reserva)) return;

  throw new ORPCError("UNAUTHORIZED", { message: "Senha incorreta." });
}

/** Salva a senha nova (só depois de conferir a atual em quem chama). */
export async function salvarSenha(nova: string) {
  const value = hashSenha(nova);
  const agora = new Date();
  const existente = await hashGuardado();

  if (existente === null) {
    await db.insert(schema.settings).values({ key: CHAVE, value, updatedAt: agora });
    return;
  }
  await db
    .update(schema.settings)
    .set({ value, updatedAt: agora })
    .where(eq(schema.settings.key, CHAVE));
}
