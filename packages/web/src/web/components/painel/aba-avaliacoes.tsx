import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileDown, RotateCcw, Save, Star } from "lucide-react";
import { useAdminAvaliacoes, useUpdateAvaliacoes } from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";

/**
 * Aba "Avaliações": a nota do Google que aparece na home.
 *
 * Antes esse número estava escrito na mão no código, então envelhecia sozinho.
 * Aqui o Diego atualiza em 30 segundos depois de olhar o perfil.
 *
 * Também gera o cartaz A6 com QR do perfil, para ir dentro da sacola do
 * cliente. É o jeito mais barato de sair de 6 avaliações: pedir na entrega.
 */

type Form = {
  rating: number;
  reviewCount: number;
  profileUrl: string;
  invite: string;
  showOnHome: boolean;
  checkedOn: string;
};

function paraForm(dados: Record<string, unknown>): Form {
  return {
    rating: Number(dados.rating ?? 5),
    reviewCount: Number(dados.reviewCount ?? 0),
    profileUrl: String(dados.profileUrl ?? ""),
    invite: String(dados.invite ?? ""),
    showOnHome: dados.showOnHome !== false,
    checkedOn: String(dados.checkedOn ?? ""),
  };
}

/** Data de hoje no fuso de São Paulo (YYYY-MM-DD). */
function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dataBr(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Quantos dias desde a última conferida. null = nunca conferiu. */
function diasDesde(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const dia = 24 * 60 * 60 * 1000;
  return Math.max(
    0,
    Math.round((Date.parse(`${hoje()}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / dia),
  );
}

export function AbaAvaliacoes({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const dados = useAdminAvaliacoes(password);
  const salvar = useUpdateAvaliacoes();

  const [form, setForm] = useState<Form | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (dados.data?.avaliacoes && form === null) {
      setForm(paraForm(dados.data.avaliacoes as unknown as Record<string, unknown>));
    }
  }, [dados.data, form]);

  const set = (patch: Partial<Form>) =>
    setForm((atual) => (atual ? { ...atual, ...patch } : atual));

  async function enviar() {
    if (!form) return;
    setAviso(null);

    if (!/^https?:\/\//i.test(form.profileUrl.trim())) {
      setAviso({
        tipo: "erro",
        texto: "O link do perfil precisa começar com https:// — é ele que vai no QR.",
      });
      return;
    }
    if (!Number.isFinite(form.rating) || form.rating < 0 || form.rating > 5) {
      setAviso({ tipo: "erro", texto: "A nota vai de 0 a 5." });
      return;
    }
    if (!Number.isFinite(form.reviewCount) || form.reviewCount < 0) {
      setAviso({ tipo: "erro", texto: "A quantidade de avaliações não pode ser negativa." });
      return;
    }

    try {
      /* Salvar já é a conferida: marca a data de hoje sozinho. */
      const salvo = { ...form, checkedOn: hoje() };
      await salvar.mutateAsync({ password, ...salvo });
      setForm(salvo);
      await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
      await queryClient.invalidateQueries({ queryKey: orpc.admin.key() });
      setAviso({
        tipo: "ok",
        texto: form.showOnHome
          ? "Salvo. A home já mostra esse número."
          : "Salvo. O bloco da nota está escondido na home.",
      });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(erro) });
    }
  }

  function restaurar() {
    const padrao = dados.data?.padrao as unknown as Record<string, unknown> | undefined;
    if (!padrao) return;
    if (!window.confirm("Voltar para o número e o texto originais?")) return;
    setForm(paraForm(padrao));
  }

  /**
   * Cartaz A6 com o QR do perfil. Quatro por folha A4, para cortar e colocar
   * na sacola. O jsPDF e o gerador de QR entram por import dinâmico — nada
   * disso pesa no site público.
   */
  async function baixarCartaz() {
    if (!form) return;
    setAviso(null);
    setGerando(true);
    try {
      const [{ jsPDF }, QRCode] = await Promise.all([
        import("jspdf"),
        import("qrcode"),
      ]);

      const qr = await QRCode.toDataURL(form.profileUrl, {
        margin: 1,
        width: 600,
        errorCorrectionLevel: "M",
        color: { dark: "#0D3E77", light: "#FFFFFF" },
      });

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const larguraA4 = doc.internal.pageSize.getWidth();
      const alturaA4 = doc.internal.pageSize.getHeight();
      const meiaL = larguraA4 / 2;
      const meiaA = alturaA4 / 2;

      /* Desenha o mesmo cartão nos quatro quadrantes da folha. */
      const cantos = [
        [0, 0],
        [meiaL, 0],
        [0, meiaA],
        [meiaL, meiaA],
      ] as const;

      for (const [x, y] of cantos) {
        const pad = 26;
        const larg = meiaL - pad * 2;

        // moldura
        doc.setDrawColor(13, 62, 119);
        doc.setLineWidth(2);
        doc.roundedRect(x + pad, y + pad, larg, meiaA - pad * 2, 12, 12, "S");

        /* Bloco centralizado na vertical: cartão sem buraco embaixo. */
        let linha = y + pad + 74;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.setTextColor(236, 0, 139);
        doc.text("Gostou da sua caneca?", x + meiaL / 2, linha, { align: "center" });

        linha += 24;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(13, 62, 119);
        doc.text("Conta pra gente no Google.", x + meiaL / 2, linha, {
          align: "center",
        });
        linha += 15;
        doc.text("Leva 20 segundos e ajuda demais.", x + meiaL / 2, linha, {
          align: "center",
        });

        // QR
        const ladoQr = 132;
        const qrY = linha + 16;
        doc.addImage(qr, "PNG", x + meiaL / 2 - ladoQr / 2, qrY, ladoQr, ladoQr);

        let rodape = qrY + ladoQr + 26;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Aponte a câmera do celular", x + meiaL / 2, rodape, {
          align: "center",
        });

        rodape += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("Caneca Maneira · @caneca_maneira_of", x + meiaL / 2, rodape, {
          align: "center",
        });
        rodape += 13;
        doc.text("canecamaneira.com.br", x + meiaL / 2, rodape, {
          align: "center",
        });
      }

      doc.save(`caneca-maneira-cartaz-avaliacao-${hoje()}.pdf`);
      setAviso({
        tipo: "ok",
        texto: "Cartaz gerado: 4 por folha A4. Imprime, corta e põe na sacola.",
      });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(erro) });
    } finally {
      setGerando(false);
    }
  }

  if (dados.isLoading || !form) {
    return (
      <section className="sticker p-6">
        <Spinner /> Carregando...
      </section>
    );
  }

  const dias = diasDesde(form.checkedOn);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="sticker p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold">
              Nota do Google
            </h2>
            <p className="mt-1 max-w-xl text-sm text-navy/65">
              É o número que aparece na home. Só coloca aqui o que dá pra
              conferir abrindo o seu perfil — nota inventada o cliente
              descobre em um clique.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-3 rounded-2xl border-[3px] border-navy bg-cream px-4 py-2.5 text-sm font-bold">
            <input
              type="checkbox"
              className="size-5 accent-magenta"
              checked={form.showOnHome}
              onChange={(e) => set({ showOnHome: e.target.checked })}
            />
            {form.showOnHome ? "Aparece na home" : "Escondido"}
          </label>
        </div>

        {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

        {dias !== null && dias >= 30 ? (
          <Aviso tipo="erro">
            Você conferiu esse número há {dias} dias. Vale dar uma olhada no
            perfil — se entrou avaliação nova, atualiza aqui.
          </Aviso>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Campo label="Nota média" hint="De 0 a 5, com uma casa (ex.: 4,8)">
            <input
              className="field"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.rating}
              onChange={(e) => set({ rating: Number(e.target.value) })}
            />
          </Campo>

          <Campo
            label="Quantidade de avaliações"
            hint="O total que o Google mostra no perfil"
          >
            <input
              className="field"
              type="number"
              min={0}
              step={1}
              value={form.reviewCount}
              onChange={(e) => set({ reviewCount: Number(e.target.value) })}
            />
          </Campo>

          <Campo
            className="sm:col-span-2"
            label="Link do perfil no Google"
            hint="Vai no botão 'Ver no Google' da home e no QR do cartaz"
          >
            <input
              className="field"
              maxLength={500}
              value={form.profileUrl}
              onChange={(e) => set({ profileUrl: e.target.value })}
            />
          </Campo>

          <Campo
            className="sm:col-span-2"
            label="Convite que aparece embaixo da nota"
            hint="Deixe vazio para usar o texto original"
          >
            <textarea
              className="field min-h-24"
              maxLength={300}
              value={form.invite}
              onChange={(e) => set({ invite: e.target.value })}
            />
          </Campo>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={enviar}
            disabled={salvar.isPending}
          >
            {salvar.isPending ? <Spinner /> : <Save className="size-4" />}
            Salvar
          </button>
          <a
            href={form.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            <ExternalLink className="size-4" />
            Abrir meu perfil
          </a>
          <button type="button" className="btn btn-ghost" onClick={restaurar}>
            <RotateCcw className="size-4" />
            Restaurar
          </button>
          {form.checkedOn ? (
            <span className="text-xs font-semibold text-navy/55">
              conferido em {dataBr(form.checkedOn)}
            </span>
          ) : null}
        </div>
      </div>

      <aside className="grid gap-6 self-start">
        <div className="sticker bg-cream p-6 text-center">
          <p className="field-label">Como fica na home</p>
          <div className="mt-3 flex justify-center gap-1 text-yellow">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-5"
                fill={i < Math.round(form.rating) ? "currentColor" : "none"}
                stroke="#0D3E77"
              />
            ))}
          </div>
          <p className="mt-3 font-display text-3xl font-extrabold text-magenta">
            {form.rating.toFixed(1).replace(".", ",")} de 5 no Google
          </p>
          <p className="mt-1 text-sm text-navy/70">
            em {form.reviewCount}{" "}
            {form.reviewCount === 1 ? "avaliação" : "avaliações"} de clientes
            reais
          </p>
        </div>

        <div className="sticker p-6">
          <h3 className="font-display text-lg font-extrabold">
            Cartaz para a sacola
          </h3>
          <p className="mt-1 text-sm text-navy/65">
            Folha A4 com 4 cartõezinhos e o QR do seu perfil. Imprime, corta e
            coloca junto com a peça na entrega — é assim que 6 avaliações
            viram 60.
          </p>
          <button
            type="button"
            className="btn btn-navy mt-4 w-full"
            onClick={baixarCartaz}
            disabled={gerando}
          >
            {gerando ? <Spinner /> : <FileDown className="size-4" />}
            Baixar cartaz em PDF
          </button>
          <p className="mt-3 text-xs text-navy/55">
            Dica: pede a avaliação na hora da entrega, olhando pra pessoa. Quem
            recebe a caneca e gosta avalia na hora; quem só recebe no papel
            esquece.
          </p>
        </div>
      </aside>
    </section>
  );
}
