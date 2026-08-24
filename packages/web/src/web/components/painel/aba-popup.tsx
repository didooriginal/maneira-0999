import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, RotateCcw, Save, Trash2 } from "lucide-react";
import { useAdminPopup, useUpdatePopup } from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";
import { UploadFoto } from "./upload-foto";

/**
 * Aba "Popup": o aviso de novidade/promoção que aparece para quem entra no
 * site. Tudo aqui é conteúdo e regra de exibição — o formato (card no
 * computador, faixa no rodapé no celular) é fixo no código, de propósito.
 */

const cores = [
  { valor: "magenta", label: "Rosa" },
  { valor: "blue", label: "Azul" },
  { valor: "yellow", label: "Amarelo" },
  { valor: "mint", label: "Verde-água" },
  { valor: "navy", label: "Azul-marinho" },
] as const;

const escopos = [
  { valor: "vitrines", label: "Home e páginas de modelos (recomendado)" },
  { valor: "home", label: "Só na página inicial" },
  { valor: "todas", label: "Em todas as páginas" },
] as const;

/** Fotos que já existem no site — atalho para não precisar subir nada. */
const sugestoes = [
  { url: "/images/arte-caricatura.jpg", label: "Caricatura" },
  { url: "/images/arte-historinha.jpg", label: "Historinha" },
  { url: "/images/hero-mugs.jpg", label: "Canecas coloridas" },
  { url: "/images/real-foto-familia.jpg", label: "Foto de família" },
  { url: "/images/real-natal-empresa.jpg", label: "Natal empresa" },
  { url: "/images/real-lote-formatura.jpg", label: "Lote formatura" },
];

type Form = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  ctaLabel: string;
  ctaKind: "whatsapp" | "link";
  ctaMessage: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  accent: string;
  delaySeconds: number;
  scrollPercent: number;
  repeatDays: number;
  scope: "home" | "vitrines" | "todas";
  startsOn: string;
  endsOn: string;
};

function paraForm(popup: Record<string, unknown>): Form {
  const t = (campo: string) => String(popup[campo] ?? "");
  const n = (campo: string) => Number(popup[campo] ?? 0);
  return {
    enabled: popup.enabled === true,
    eyebrow: t("eyebrow"),
    title: t("title"),
    text: t("text"),
    image: t("image"),
    imageAlt: t("imageAlt"),
    ctaLabel: t("ctaLabel"),
    ctaKind: popup.ctaKind === "link" ? "link" : "whatsapp",
    ctaMessage: t("ctaMessage"),
    ctaHref: t("ctaHref"),
    secondaryLabel: t("secondaryLabel"),
    secondaryHref: t("secondaryHref"),
    accent: t("accent") || "magenta",
    delaySeconds: n("delaySeconds"),
    scrollPercent: n("scrollPercent"),
    repeatDays: n("repeatDays"),
    scope: (["home", "vitrines", "todas"].includes(String(popup.scope))
      ? popup.scope
      : "vitrines") as Form["scope"],
    startsOn: t("startsOn"),
    endsOn: t("endsOn"),
  };
}

const fundoPreview: Record<string, string> = {
  magenta: "bg-magenta text-white",
  blue: "bg-blue text-navy",
  yellow: "bg-yellow text-navy",
  mint: "bg-mint text-navy",
  navy: "bg-navy text-cream",
};

export function AbaPopup({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const dados = useAdminPopup(password);
  const salvar = useUpdatePopup();

  const [form, setForm] = useState<Form | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  useEffect(() => {
    if (dados.data?.popup && form === null) {
      setForm(paraForm(dados.data.popup as unknown as Record<string, unknown>));
    }
  }, [dados.data, form]);

  const set = (patch: Partial<Form>) =>
    setForm((atual) => (atual ? { ...atual, ...patch } : atual));

  async function enviar() {
    if (!form) return;
    setAviso(null);

    if (!form.title.trim() || !form.text.trim()) {
      setAviso({ tipo: "erro", texto: "Título e texto são obrigatórios." });
      return;
    }
    if (!form.ctaLabel.trim()) {
      setAviso({ tipo: "erro", texto: "O botão precisa de um texto." });
      return;
    }
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) {
      setAviso({ tipo: "erro", texto: "A data final é antes da inicial." });
      return;
    }
    if (form.delaySeconds === 0 && form.scrollPercent === 0) {
      setAviso({
        tipo: "erro",
        texto:
          "Sem tempo e sem rolagem o popup abriria na hora. Preencha pelo menos um dos dois.",
      });
      return;
    }

    try {
      await salvar.mutateAsync({ password, ...form });
      await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
      await queryClient.invalidateQueries({ queryKey: orpc.admin.key() });
      setAviso({
        tipo: "ok",
        texto: form.enabled
          ? "Salvo. O popup está no ar (respeitando as datas)."
          : "Salvo. O popup está desligado — ninguém vê.",
      });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(erro) });
    }
  }

  function restaurar() {
    const padrao = dados.data?.padrao as unknown as Record<string, unknown> | undefined;
    if (!padrao) return;
    if (!window.confirm("Voltar ao texto original? O que você escreveu se perde."))
      return;
    setForm({ ...paraForm(padrao), enabled: form?.enabled ?? false });
  }

  if (dados.isLoading || !form) {
    return (
      <section className="sticker p-6">
        <Spinner /> Carregando...
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="sticker p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold">
              Popup de novidades
            </h2>
            <p className="mt-1 max-w-xl text-sm text-navy/65">
              Aparece como card no computador e como faixa no rodapé no celular.
              Nunca aparece nas páginas de pedido — quem está lá já está
              comprando.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-3 rounded-2xl border-[3px] border-navy bg-cream px-4 py-2.5 text-sm font-bold">
            <input
              type="checkbox"
              className="size-5 accent-magenta"
              checked={form.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
            />
            {form.enabled ? "Ligado" : "Desligado"}
          </label>
        </div>

        {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Campo
            label="Selinho de cima"
            hint="Frase curta. Vazio = não aparece."
            className="sm:col-span-2"
          >
            <input
              className="field"
              maxLength={60}
              value={form.eyebrow}
              onChange={(e) => set({ eyebrow: e.target.value })}
            />
          </Campo>

          <Campo label="Título" className="sm:col-span-2">
            <input
              className="field"
              maxLength={90}
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Campo>

          <Campo
            label="Texto"
            hint="Duas ou três linhas no máximo — popup comprido ninguém lê."
            className="sm:col-span-2"
          >
            <textarea
              className="field min-h-28"
              maxLength={400}
              value={form.text}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Campo>

          <div className="sm:col-span-2">
            <span className="field-label block">Foto (opcional)</span>
            <p className="mb-3 text-xs text-navy/55">
              No celular a foto não aparece, para a faixa ficar baixinha.
            </p>

            {form.image ? (
              <div className="mb-3 flex items-center gap-3">
                <div className="h-20 w-32 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                  <img
                    src={form.image}
                    alt="Prévia"
                    className="size-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-2 text-sm"
                  onClick={() => set({ image: "", imageAlt: "" })}
                >
                  <Trash2 className="size-4" /> Tirar foto
                </button>
              </div>
            ) : null}

            <div className="mb-3 flex flex-wrap gap-2">
              {sugestoes.map((foto) => (
                <button
                  key={foto.url}
                  type="button"
                  title={foto.label}
                  className={`size-14 overflow-hidden rounded-xl border-[3px] ${
                    form.image === foto.url ? "border-magenta" : "border-navy"
                  }`}
                  onClick={() => set({ image: foto.url, imageAlt: foto.label })}
                >
                  <img
                    src={foto.url}
                    alt={foto.label}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>

            <UploadFoto
              password={password}
              label="Ou subir outra foto"
              atual={null}
              onEnviado={(publicUrl) => set({ image: publicUrl })}
            />
          </div>

          <Campo
            label="Descrição da foto"
            hint="Para acessibilidade e para o Google."
            className="sm:col-span-2"
          >
            <input
              className="field"
              maxLength={200}
              value={form.imageAlt}
              onChange={(e) => set({ imageAlt: e.target.value })}
            />
          </Campo>
        </div>

        <div className="mt-6 border-t-[3px] border-dashed border-navy/20 pt-5">
          <h3 className="font-display text-lg font-extrabold">Botão</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Texto do botão">
              <input
                className="field"
                maxLength={40}
                value={form.ctaLabel}
                onChange={(e) => set({ ctaLabel: e.target.value })}
              />
            </Campo>

            <Campo label="Para onde leva">
              <select
                className="field"
                value={form.ctaKind}
                onChange={(e) =>
                  set({ ctaKind: e.target.value as Form["ctaKind"] })
                }
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="link">Uma página do site</option>
              </select>
            </Campo>

            {form.ctaKind === "whatsapp" ? (
              <Campo
                label="Mensagem que já vai escrita"
                hint="É o que a pessoa manda pra gente ao clicar."
                className="sm:col-span-2"
              >
                <textarea
                  className="field min-h-20"
                  maxLength={300}
                  value={form.ctaMessage}
                  onChange={(e) => set({ ctaMessage: e.target.value })}
                />
              </Campo>
            ) : (
              <Campo
                label="Link"
                hint="Ex.: /pedido, /modelos, /prontos"
                className="sm:col-span-2"
              >
                <input
                  className="field"
                  maxLength={300}
                  value={form.ctaHref}
                  onChange={(e) => set({ ctaHref: e.target.value })}
                />
              </Campo>
            )}

            <Campo
              label="Link pequeno embaixo"
              hint="Vazio = não aparece. Serve pro público secundário."
            >
              <input
                className="field"
                maxLength={40}
                value={form.secondaryLabel}
                onChange={(e) => set({ secondaryLabel: e.target.value })}
              />
            </Campo>
            <Campo label="Destino do link pequeno">
              <input
                className="field"
                maxLength={300}
                value={form.secondaryHref}
                onChange={(e) => set({ secondaryHref: e.target.value })}
              />
            </Campo>
          </div>
        </div>

        <div className="mt-6 border-t-[3px] border-dashed border-navy/20 pt-5">
          <h3 className="font-display text-lg font-extrabold">
            Quando e onde aparece
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo label="Onde" className="sm:col-span-2">
              <select
                className="field"
                value={form.scope}
                onChange={(e) => set({ scope: e.target.value as Form["scope"] })}
              >
                {escopos.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              label="Aparece depois de (segundos)"
              hint="0 = não usa tempo. Menos de 5s incomoda."
            >
              <input
                type="number"
                min={0}
                max={120}
                className="field"
                value={form.delaySeconds}
                onChange={(e) =>
                  set({ delaySeconds: Number(e.target.value) || 0 })
                }
              />
            </Campo>

            <Campo
              label="Ou ao rolar (%)"
              hint="0 = não usa rolagem. O que vier primeiro abre."
            >
              <input
                type="number"
                min={0}
                max={100}
                className="field"
                value={form.scrollPercent}
                onChange={(e) =>
                  set({ scrollPercent: Number(e.target.value) || 0 })
                }
              />
            </Campo>

            <Campo
              label="Se fechar, só volta depois de (dias)"
              hint="0 = volta em toda visita. Não recomendado."
            >
              <input
                type="number"
                min={0}
                max={365}
                className="field"
                value={form.repeatDays}
                onChange={(e) => set({ repeatDays: Number(e.target.value) || 0 })}
              />
            </Campo>

            <div />

            <Campo label="Começa em" hint="Vazio = já vale.">
              <input
                type="date"
                className="field"
                value={form.startsOn}
                onChange={(e) => set({ startsOn: e.target.value })}
              />
            </Campo>
            <Campo label="Termina em" hint="Vazio = sem prazo. Some sozinho.">
              <input
                type="date"
                className="field"
                value={form.endsOn}
                onChange={(e) => set({ endsOn: e.target.value })}
              />
            </Campo>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={salvar.isPending}
            onClick={() => void enviar()}
          >
            {salvar.isPending ? (
              <>
                <Spinner /> Salvando...
              </>
            ) : (
              <>
                <Save className="size-4" /> Salvar
              </>
            )}
          </button>
          <button type="button" className="btn btn-ghost" onClick={restaurar}>
            <RotateCcw className="size-4" /> Voltar ao texto original
          </button>
        </div>
      </div>

      {/* Prévia: como fica no computador. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold">
          <Eye className="size-4" /> Prévia
        </p>
        <div className="overflow-hidden rounded-3xl border-[3px] border-navy bg-white shadow-[6px_6px_0_var(--color-navy)]">
          {form.image ? (
            <div className="aspect-[16/9] w-full border-b-[3px] border-navy bg-cream">
              <img
                src={form.image}
                alt=""
                className="size-full object-contain"
              />
            </div>
          ) : null}
          <div className="p-5">
            {form.eyebrow ? (
              <span
                className={`tag ${fundoPreview[form.accent] ?? fundoPreview.magenta}`}
              >
                {form.eyebrow}
              </span>
            ) : null}
            <h3 className="mt-3 font-display text-xl leading-tight font-extrabold">
              {form.title || "Título do popup"}
            </h3>
            <p className="mt-2 text-sm text-navy/75">
              {form.text || "Texto do popup."}
            </p>
            <span className="btn btn-primary mt-4 w-full">
              {form.ctaLabel || "Botão"}
            </span>
            {form.secondaryLabel ? (
              <span className="mt-3 block text-center text-sm font-semibold text-navy/65 underline">
                {form.secondaryLabel}
              </span>
            ) : null}
          </div>
        </div>

        <Campo label="Cor do selinho" className="mt-4">
          <select
            className="field"
            value={form.accent}
            onChange={(e) => set({ accent: e.target.value })}
          >
            {cores.map((cor) => (
              <option key={cor.valor} value={cor.valor}>
                {cor.label}
              </option>
            ))}
          </select>
        </Campo>

        <p className="mt-4 rounded-2xl border-[3px] border-dashed border-navy/25 bg-cream p-4 text-xs text-navy/65">
          Mexeu no título, no texto ou na foto? Quem já tinha fechado o popup
          volta a ver — é um recado novo. Mudar só a cor ou o tempo não incomoda
          ninguém de novo.
        </p>
      </aside>
    </section>
  );
}
