import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save, Star, CheckCircle2 } from "lucide-react";
import { useAdminHero, useUpdateHero } from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";
import { UploadFoto } from "./upload-foto";

/**
 * Aba "Topo da home": a primeira coisa que o cliente vê no site — a foto
 * grande, o título, a frase e os três selinhos.
 *
 * Tem prévia ao lado do formulário porque esse pedaço é o cartão de visita:
 * dá para conferir antes de salvar.
 */

interface Form {
  eyebrow: string;
  titleTop: string;
  titleBottom: string;
  titleScript: string;
  highlight: string;
  paragraph: string;
  badges: string[];
  image: string;
  imageAlt: string;
}

/** Sempre três caixas de selinho na tela, mesmo que alguma esteja vazia. */
function tresSelinhos(badges: string[]) {
  return [badges[0] ?? "", badges[1] ?? "", badges[2] ?? ""];
}

function Previa({ valor }: { valor: Form }) {
  const selinhos = valor.badges.map((b) => b.trim()).filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-navy bg-blue">
      <div className="grid gap-4 p-5 sm:grid-cols-[1.05fr_0.95fr] sm:items-center">
        <div>
          {valor.eyebrow.trim() ? (
            <span className="tag bg-white !text-[0.6rem]">
              <Star className="size-3 fill-yellow" strokeWidth={2.5} />
              {valor.eyebrow}
            </span>
          ) : null}

          <p className="mt-2 font-display text-2xl leading-[1.05] font-extrabold">
            {valor.titleTop}
            {valor.titleBottom.trim() || valor.titleScript.trim() ? (
              <>
                <br />
                {valor.titleBottom}
                {valor.titleScript.trim() ? (
                  <>
                    {valor.titleBottom.trim() ? " " : ""}
                    <span className="script text-[1.2em] text-magenta">
                      {valor.titleScript}
                    </span>
                  </>
                ) : null}
              </>
            ) : null}
          </p>

          {valor.highlight.trim() ? (
            <p className="mt-2 inline-block bg-yellow px-2 py-1 font-display text-[0.7rem] font-extrabold uppercase">
              {valor.highlight}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-navy/75">{valor.paragraph}</p>

          {selinhos.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] font-semibold">
              {selinhos.map((item) => (
                <span key={item} className="flex items-center gap-1">
                  <CheckCircle2 className="size-3" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border-[3px] border-navy bg-white">
          {valor.image ? (
            <img
              src={valor.image}
              alt={valor.imageAlt}
              className="aspect-4/3 w-full object-cover"
            />
          ) : (
            <div className="grid aspect-4/3 place-items-center text-xs text-navy/50">
              sem foto
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AbaTopo({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const dados = useAdminHero(password);
  const salvarHero = useUpdateHero();

  const [form, setForm] = useState<Form | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  // Carrega o que está no ar assim que a aba abre (e só então).
  const salvo = dados.data?.hero;
  useEffect(() => {
    if (salvo && form === null) {
      setForm({ ...salvo, badges: tresSelinhos(salvo.badges) });
    }
  }, [salvo, form]);

  if (dados.isLoading || !form) {
    return (
      <p className="flex items-center gap-2 text-sm text-navy/65">
        <Spinner /> Carregando o topo do site...
      </p>
    );
  }

  const mudar = (parcial: Partial<Form>) =>
    setForm((atual) => (atual ? { ...atual, ...parcial } : atual));

  function mudarSelinho(indice: number, texto: string) {
    setForm((atual) => {
      if (!atual) return atual;
      const badges = tresSelinhos(atual.badges);
      badges[indice] = texto;
      return { ...atual, badges };
    });
  }

  function voltarAoPadrao() {
    const padrao = dados.data?.padrao;
    if (!padrao) return;
    setForm({ ...padrao, badges: tresSelinhos(padrao.badges) });
    setAviso({
      tipo: "ok",
      texto: "Textos originais de volta no formulário. Clique em salvar para valer.",
    });
  }

  async function salvar() {
    if (!form) return;
    setAviso(null);

    if (form.titleTop.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "O título do topo não pode ficar vazio." });
      return;
    }
    if (form.paragraph.trim().length < 10) {
      setAviso({ tipo: "erro", texto: "Escreva um pouco mais na frase de explicação." });
      return;
    }
    if (!form.image.trim()) {
      setAviso({ tipo: "erro", texto: "Escolha a foto grande do topo." });
      return;
    }
    if (!form.imageAlt.trim()) {
      setAviso({
        tipo: "erro",
        texto: "Descreva a foto em poucas palavras (ajuda o Google e quem não enxerga).",
      });
      return;
    }

    try {
      await salvarHero.mutateAsync({
        password,
        eyebrow: form.eyebrow.trim(),
        titleTop: form.titleTop.trim(),
        titleBottom: form.titleBottom.trim(),
        titleScript: form.titleScript.trim(),
        highlight: form.highlight.trim(),
        paragraph: form.paragraph.trim(),
        badges: form.badges.map((item) => item.trim()).filter(Boolean),
        image: form.image.trim(),
        imageAlt: form.imageAlt.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
      await dados.refetch();
      setAviso({ tipo: "ok", texto: "Topo do site atualizado." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">Topo da home</h2>
        <p className="mt-1 text-sm text-navy/65">
          É a primeira tela de quem entra no site. Mude a foto, o título, a
          frase e os três selinhos.
        </p>
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <Previa valor={form} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Selinho de cima"
          hint="Aparece na etiqueta branca com a estrela. Vazio = some."
          className="sm:col-span-2"
        >
          <input
            className="field"
            maxLength={60}
            value={form.eyebrow}
            onChange={(event) => mudar({ eyebrow: event.target.value })}
          />
        </Campo>

        <Campo label="Título — 1ª linha">
          <input
            className="field"
            maxLength={40}
            value={form.titleTop}
            onChange={(event) => mudar({ titleTop: event.target.value })}
          />
        </Campo>
        <Campo label="Título — 2ª linha" hint="Vazio = título de uma linha só.">
          <input
            className="field"
            maxLength={40}
            value={form.titleBottom}
            onChange={(event) => mudar({ titleBottom: event.target.value })}
          />
        </Campo>
        <Campo
          label="Palavra em destaque"
          hint="Sai na letra manuscrita rosa, no fim do título."
          className="sm:col-span-2"
        >
          <input
            className="field"
            maxLength={30}
            value={form.titleScript}
            onChange={(event) => mudar({ titleScript: event.target.value })}
          />
        </Campo>

        <Campo
          label="Frase da tarja amarela"
          hint="Vazio = a tarja some."
          className="sm:col-span-2"
        >
          <input
            className="field"
            maxLength={120}
            value={form.highlight}
            onChange={(event) => mudar({ highlight: event.target.value })}
          />
        </Campo>

        <Campo label="Frase de explicação" className="sm:col-span-2">
          <textarea
            className="field min-h-28"
            maxLength={600}
            value={form.paragraph}
            onChange={(event) => mudar({ paragraph: event.target.value })}
          />
        </Campo>

        <div className="sm:col-span-2">
          <span className="field-label block">Os três selinhos</span>
          <div className="mt-1 grid gap-3 sm:grid-cols-3">
            {tresSelinhos(form.badges).map((texto, indice) => (
              <input
                // eslint-disable-next-line react/no-array-index-key
                key={indice}
                className="field"
                maxLength={60}
                placeholder={`Selinho ${indice + 1}`}
                value={texto}
                onChange={(event) => mudarSelinho(indice, event.target.value)}
              />
            ))}
          </div>
          <span className="mt-1 block text-xs text-navy/55">
            Deixe vazio o que não quiser mostrar.
          </span>
        </div>

        <div className="sm:col-span-2">
          <span className="field-label block">Foto grande do topo</span>
          <div className="mt-1">
            <UploadFoto
              password={password}
              atual={form.image}
              label="Foto do topo"
              onEnviado={(url) => mudar({ image: url })}
            />
          </div>
          <span className="mt-1 block text-xs text-navy/55">
            Use uma foto deitada (mais larga que alta). O site corta no formato
            4x3.
          </span>
        </div>

        <Campo
          label="Descrição da foto"
          hint="Em poucas palavras, o que aparece na foto."
          className="sm:col-span-2"
        >
          <input
            className="field"
            maxLength={200}
            value={form.imageAlt}
            onChange={(event) => mudar({ imageAlt: event.target.value })}
          />
        </Campo>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvarHero.isPending}
          className="btn btn-primary"
        >
          {salvarHero.isPending ? <Spinner /> : <Save className="size-4" />}
          Salvar topo
        </button>
        <button type="button" onClick={voltarAoPadrao} className="btn btn-ghost">
          <RotateCcw className="size-4" />
          Voltar aos textos originais
        </button>
      </div>
    </div>
  );
}
