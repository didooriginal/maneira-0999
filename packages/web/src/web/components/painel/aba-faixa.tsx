import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  useAdminBanners,
  useRemoveBanner,
  useSaveBanner,
} from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";

const cores = [
  { valor: "magenta", label: "Rosa" },
  { valor: "blue", label: "Azul" },
  { valor: "yellow", label: "Amarelo" },
  { valor: "mint", label: "Verde-água" },
  { valor: "navy", label: "Azul-marinho" },
] as const;

type Accent = (typeof cores)[number]["valor"];

type Faixa = {
  id: number;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  emoji: string | null;
  accent: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
};

type Form = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  emoji: string;
  accent: Accent;
  startsOn: string;
  endsOn: string;
  active: boolean;
};

/** Data de hoje no fuso de São Paulo, no formato YYYY-MM-DD. */
function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formVazio(): Form {
  const hoje = hojeSP();
  return {
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaHref: "/pedido",
    emoji: "",
    accent: "magenta",
    startsOn: hoje,
    endsOn: hoje,
    active: true,
  };
}

function paraForm(faixa: Faixa): Form {
  return {
    title: faixa.title,
    subtitle: faixa.subtitle ?? "",
    ctaLabel: faixa.ctaLabel ?? "",
    ctaHref: faixa.ctaHref ?? "",
    emoji: faixa.emoji ?? "",
    accent: (cores.find((cor) => cor.valor === faixa.accent)?.valor ??
      "magenta") as Accent,
    startsOn: faixa.startsOn,
    endsOn: faixa.endsOn,
    active: faixa.active,
  };
}

function situacao(faixa: Faixa) {
  const hoje = hojeSP();
  if (!faixa.active) return { texto: "Desligada", cor: "bg-navy/15" };
  if (hoje < faixa.startsOn) return { texto: "Agendada", cor: "bg-blue" };
  if (hoje > faixa.endsOn) return { texto: "Encerrada", cor: "bg-navy/15" };
  return { texto: "No ar agora", cor: "bg-mint" };
}

function Formulario({
  valor,
  onChange,
}: {
  valor: Form;
  onChange: (proximo: Form) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo label="Título" className="sm:col-span-2">
        <input
          className="field"
          value={valor.title}
          onChange={(event) => onChange({ ...valor, title: event.target.value })}
        />
      </Campo>
      <Campo label="Texto de apoio" className="sm:col-span-2">
        <input
          className="field"
          value={valor.subtitle}
          onChange={(event) => onChange({ ...valor, subtitle: event.target.value })}
        />
      </Campo>
      <Campo label="Texto do botão" hint="Deixe vazio para faixa sem botão.">
        <input
          className="field"
          value={valor.ctaLabel}
          onChange={(event) => onChange({ ...valor, ctaLabel: event.target.value })}
        />
      </Campo>
      <Campo label="Link do botão" hint="Ex.: /pedido ou /catalogo">
        <input
          className="field"
          value={valor.ctaHref}
          onChange={(event) => onChange({ ...valor, ctaHref: event.target.value })}
        />
      </Campo>
      <Campo label="Emoji" hint="Opcional, aparece antes do título.">
        <input
          className="field"
          maxLength={4}
          value={valor.emoji}
          onChange={(event) => onChange({ ...valor, emoji: event.target.value })}
        />
      </Campo>
      <Campo label="Cor da faixa">
        <select
          className="field"
          value={valor.accent}
          onChange={(event) =>
            onChange({ ...valor, accent: event.target.value as Accent })
          }
        >
          {cores.map((cor) => (
            <option key={cor.valor} value={cor.valor}>
              {cor.label}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Começa em">
        <input
          type="date"
          className="field"
          value={valor.startsOn}
          onChange={(event) => onChange({ ...valor, startsOn: event.target.value })}
        />
      </Campo>
      <Campo label="Termina em">
        <input
          type="date"
          className="field"
          value={valor.endsOn}
          onChange={(event) => onChange({ ...valor, endsOn: event.target.value })}
        />
      </Campo>
      <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
        <input
          type="checkbox"
          className="size-5 accent-magenta"
          checked={valor.active}
          onChange={(event) => onChange({ ...valor, active: event.target.checked })}
        />
        Ligada (dentro das datas, aparece no topo do site)
      </label>
    </div>
  );
}

export function AbaFaixa({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const faixas = useAdminBanners(password);
  const salvarFaixa = useSaveBanner();
  const removerFaixa = useRemoveBanner();

  const [novo, setNovo] = useState<Form>(formVazio);
  const [edicoes, setEdicoes] = useState<Record<number, Form>>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  const lista = (faixas.data ?? []) as Faixa[];

  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await faixas.refetch();
  }

  function validar(form: Form) {
    if (form.title.trim().length < 3) return "O título está curto demais.";
    if (!form.startsOn || !form.endsOn) return "Preencha as duas datas.";
    if (form.endsOn < form.startsOn)
      return "A data de fim não pode ser antes da data de início.";
    if (form.ctaLabel.trim() && !form.ctaHref.trim())
      return "Você colocou texto no botão mas esqueceu o link.";
    return null;
  }

  function payload(form: Form) {
    return {
      password,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      ctaHref: form.ctaHref.trim() || null,
      emoji: form.emoji.trim() || null,
      accent: form.accent,
      startsOn: form.startsOn,
      endsOn: form.endsOn,
      active: form.active,
    };
  }

  async function criar() {
    setAviso(null);
    const erro = validar(novo);
    if (erro) {
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    try {
      await salvarFaixa.mutateAsync(payload(novo));
      setNovo(formVazio());
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Faixa criada. Aparece e sai sozinha pelas datas." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function salvar(id: number) {
    const form = edicoes[id];
    if (!form) return;
    setAviso(null);
    const erro = validar(form);
    if (erro) {
      setAviso({ tipo: "erro", texto: erro });
      return;
    }
    try {
      await salvarFaixa.mutateAsync({ ...payload(form), id });
      setEdicoes((atual) => {
        const copia = { ...atual };
        delete copia[id];
        return copia;
      });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Faixa atualizada." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function remover(faixa: Faixa) {
    if (!window.confirm(`Apagar a faixa "${faixa.title}"?`)) return;
    setAviso(null);
    try {
      await removerFaixa.mutateAsync({ password, id: faixa.id });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Faixa apagada." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">Faixa sazonal</h2>
      <p className="mt-2 max-w-2xl text-sm text-navy/65">
        A tarja que aparece no topo de todas as páginas em datas especiais (Dia
        dos Pais, Natal, formatura). Você agenda as datas e esquece: ela entra e
        sai sozinha, no horário de Brasília.
      </p>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <div className="sticker mt-6 p-5">
        <h3 className="font-display text-lg font-extrabold">Nova faixa</h3>
        <div className="mt-4">
          <Formulario valor={novo} onChange={setNovo} />
        </div>
        <button
          type="button"
          className="btn btn-primary mt-5"
          disabled={salvarFaixa.isPending}
          onClick={() => void criar()}
        >
          {salvarFaixa.isPending ? (
            <>
              <Spinner /> Criando...
            </>
          ) : (
            <>
              <Plus className="size-4" /> Criar faixa
            </>
          )}
        </button>
      </div>

      {faixas.isLoading ? (
        <p className="mt-6 text-navy/60">Carregando faixas...</p>
      ) : lista.length === 0 ? (
        <p className="mt-6 text-navy/60">Nenhuma faixa cadastrada ainda.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {lista.map((faixa) => {
            const form = edicoes[faixa.id] ?? paraForm(faixa);
            const mudou = Boolean(edicoes[faixa.id]);
            const estado = situacao(faixa);
            return (
              <article key={faixa.id} className="sticker p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-display text-lg">
                    {faixa.emoji ? `${faixa.emoji} ` : ""}
                    {faixa.title}
                  </strong>
                  <span className={`tag ${estado.cor}`}>{estado.texto}</span>
                  <span className="text-xs text-navy/60">
                    {faixa.startsOn.split("-").reverse().join("/")} até{" "}
                    {faixa.endsOn.split("-").reverse().join("/")}
                  </span>
                </div>

                <div className="mt-4">
                  <Formulario
                    valor={form}
                    onChange={(proximo) =>
                      setEdicoes((atual) => ({ ...atual, [faixa.id]: proximo }))
                    }
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary !px-4 !py-2 !text-sm"
                    disabled={!mudou || salvarFaixa.isPending}
                    onClick={() => void salvar(faixa.id)}
                  >
                    <Save className="size-4" /> Salvar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !px-4 !py-2 !text-sm"
                    disabled={removerFaixa.isPending}
                    onClick={() => void remover(faixa)}
                  >
                    <Trash2 className="size-4" /> Apagar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
