import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { usePresignUpload } from "../../queries/admin";
import { cn } from "../../lib/utils";
import { Aviso, mensagemDeErro } from "./bits";

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const PDF = "application/pdf";
/* ZIP às vezes chega como x-zip-compressed (Windows) ou sem tipo nenhum —
   nesse último caso a extensão .zip é o que decide. Mesma regra do servidor. */
const TIPOS_ZIP = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];
const TAMANHO_MAX = 12 * 1024 * 1024;

/**
 * Envia a foto do celular ou do computador direto para o storage e devolve o
 * caminho público (`/midia/...`) para gravar no banco.
 *
 * A validação é feita aqui só para dar resposta rápida — o servidor valida de
 * novo em `upload.presign`.
 */
export function UploadFoto({
  password,
  atual,
  onEnviado,
  label = "Foto",
  aceitaPdf = false,
  aceitaArte = false,
}: {
  password: string;
  atual?: string | null;
  onEnviado: (publicUrl: string, filename: string) => void;
  label?: string;
  /** Libera PDF além de imagem — usado na arte final do pedido. */
  aceitaPdf?: boolean;
  /** Libera PDF e ZIP — arte digital dos modelos prontos. */
  aceitaArte?: boolean;
}) {
  const presign = usePresignUpload();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function enviar(file: File | undefined) {
    if (!file) return;
    setErro(null);

    const aceitos = aceitaArte
      ? [...TIPOS_IMAGEM, PDF, ...TIPOS_ZIP]
      : aceitaPdf
        ? [...TIPOS_IMAGEM, PDF]
        : TIPOS_IMAGEM;
    const zipFalso =
      file.type === "application/octet-stream" &&
      !file.name.toLowerCase().endsWith(".zip");
    if (!aceitos.includes(file.type) || zipFalso) {
      setErro(
        aceitaArte
          ? "Só aceito imagem (JPG, PNG, WebP, AVIF), PDF ou ZIP."
          : aceitaPdf
            ? "Só aceito imagem (JPG, PNG, WebP, AVIF) ou PDF."
            : "Só aceito imagem JPG, PNG, WebP ou AVIF.",
      );
      return;
    }
    if (file.size > TAMANHO_MAX) {
      setErro("Arquivo muito grande. O limite é 12 MB.");
      return;
    }

    setEnviando(true);
    try {
      const { url, publicUrl } = await presign.mutateAsync({
        password,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        allowPdf: aceitaPdf,
        allowArt: aceitaArte,
      });

      const resposta = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!resposta.ok) {
        throw new Error("O storage recusou o envio. Tenta de novo.");
      }

      onEnviado(publicUrl, file.name);
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setEnviando(false);
      if (galeriaRef.current) galeriaRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="field-label block">{label}</span>

      <div className="flex flex-wrap items-center gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
          {atual && /\.(pdf|zip)$/i.test(atual) ? (
            <span className="grid size-full place-items-center text-xs font-bold text-navy/70">
              {atual.toLowerCase().endsWith(".zip") ? "ZIP" : "PDF"}
            </span>
          ) : atual ? (
            <img
              src={atual}
              alt="Pré-visualização da foto"
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center text-xs text-navy/50">
              {aceitaPdf || aceitaArte ? "sem arquivo" : "sem foto"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-ghost !px-4 !py-2 !text-sm"
            disabled={enviando}
            onClick={() => galeriaRef.current?.click()}
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {enviando
              ? "Enviando..."
              : aceitaPdf || aceitaArte
                ? "Escolher arquivo"
                : "Escolher foto"}
          </button>

          <button
            type="button"
            className={cn(
              "btn btn-ghost !px-4 !py-2 !text-sm sm:hidden",
              aceitaArte && "hidden",
            )}
            disabled={enviando}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" />
            Tirar foto
          </button>
        </div>
      </div>

      <input
        ref={galeriaRef}
        type="file"
        accept={
          aceitaArte
            ? "image/jpeg,image/png,image/webp,image/avif,application/pdf,.zip"
            : aceitaPdf
              ? "image/jpeg,image/png,image/webp,image/avif,application/pdf"
              : "image/jpeg,image/png,image/webp,image/avif"
        }
        className="hidden"
        onChange={(event) => void enviar(event.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void enviar(event.target.files?.[0])}
      />

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}
    </div>
  );
}
