import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Save } from "lucide-react";
import {
  useAdminPriceModels,
  useResetPriceModel,
  useSavePriceModel,
} from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, brl, mensagemDeErro } from "./bits";
import { ResumoPrecos, type Modelo, type Tier } from "./resumo-precos";

type Rascunho = {
  retailFrom: string;
  retailTo: string;
  tiers: { min: string; max: string; unit: string; label: string }[];
};

function paraRascunho(modelo: Modelo): Rascunho {
  return {
    retailFrom: String(modelo.retailFrom),
    retailTo: String(modelo.retailTo),
    tiers: modelo.tiers.map((tier) => ({
      min: String(tier.min),
      max: String(tier.max),
      unit: String(tier.unit),
      label: tier.label,
    })),
  };
}

function numero(valor: string) {
  return Number(valor.replace(",", "."));
}

export function AbaPrecos({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const modelos = useAdminPriceModels(password);
  const salvarModelo = useSavePriceModel();
  const resetar = useResetPriceModel();

  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  const lista = (modelos.data ?? []) as Modelo[];

  useEffect(() => {
    if (!modelos.data) return;
    setRascunhos((atual) => {
      const proximo = { ...atual };
      for (const modelo of modelos.data as Modelo[]) {
        if (!proximo[modelo.key]) proximo[modelo.key] = paraRascunho(modelo);
      }
      return proximo;
    });
  }, [modelos.data]);

  async function atualizarTudo() {
    // O site e a IA leem preço por quotes.* — tudo tem que recarregar junto.
    await queryClient.invalidateQueries({ queryKey: orpc.quotes.key() });
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await modelos.refetch();
  }

  async function salvar(modelo: Modelo) {
    const rascunho = rascunhos[modelo.key];
    if (!rascunho) return;
    setAviso(null);

    const retailFrom = numero(rascunho.retailFrom);
    const retailTo = numero(rascunho.retailTo);

    if (!Number.isFinite(retailFrom) || retailFrom <= 0) {
      setAviso({ tipo: "erro", texto: "O varejo inicial tem que ser maior que zero." });
      return;
    }
    if (!Number.isFinite(retailTo) || retailTo < retailFrom) {
      setAviso({
        tipo: "erro",
        texto: "O varejo final não pode ser menor que o inicial.",
      });
      return;
    }

    const tiers: Tier[] = [];
    for (const tier of rascunho.tiers) {
      const min = Math.trunc(numero(tier.min));
      const max = Math.trunc(numero(tier.max));
      const unit = numero(tier.unit);
      if (!Number.isFinite(min) || min < 1) {
        setAviso({ tipo: "erro", texto: `Quantidade inicial inválida em "${tier.label}".` });
        return;
      }
      if (!Number.isFinite(max) || max < min) {
        setAviso({
          tipo: "erro",
          texto: `A faixa "${tier.label}" tem quantidade final menor que a inicial.`,
        });
        return;
      }
      if (!Number.isFinite(unit) || unit <= 0) {
        setAviso({ tipo: "erro", texto: `Preço inválido em "${tier.label}".` });
        return;
      }
      tiers.push({ min, max, unit, label: tier.label.trim() || `${min} a ${max}` });
    }

    try {
      await salvarModelo.mutateAsync({
        password,
        modelKey: modelo.key,
        retailFrom,
        retailTo,
        tiers,
      });
      await atualizarTudo();
      setAviso({
        tipo: "ok",
        texto: `Preço de "${modelo.name}" atualizado no site, nos orçamentos e no atendente de IA.`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function voltarAoPadrao(modelo: Modelo) {
    if (!window.confirm(`Voltar "${modelo.name}" para o preço original?`)) return;
    setAviso(null);
    try {
      await resetar.mutateAsync({ password, modelKey: modelo.key });
      setRascunhos((atual) => {
        const copia = { ...atual };
        delete copia[modelo.key];
        return copia;
      });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: `"${modelo.name}" voltou ao preço padrão.` });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  if (modelos.isLoading) {
    return <p className="text-navy/60">Carregando tabela de preços...</p>;
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">
        Tabela de preços
      </h2>
      <Aviso tipo="info">
        Isto é a fonte única de preço. O que você salvar aqui muda ao mesmo tempo
        no site, nos orçamentos do formulário <strong>e</strong> nas respostas do
        atendente de IA — por isso eles nunca falam valores diferentes.
      </Aviso>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <ResumoPrecos modelos={lista} />

      <div className="mt-6 space-y-5">
        {lista.map((modelo) => {
          const rascunho = rascunhos[modelo.key] ?? paraRascunho(modelo);
          return (
            <article key={modelo.key} className="sticker p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-extrabold">
                  {modelo.name}
                </h3>
                {modelo.editado ? (
                  <span className="tag bg-mint">Editado por você</span>
                ) : (
                  <span className="tag bg-cream">Preço padrão</span>
                )}
              </div>
              <p className="mt-1 text-xs text-navy/60">
                No ar agora: {modelo.retailRange} no varejo · atacado a partir de{" "}
                {brl(modelo.tiers[modelo.tiers.length - 1]?.unit ?? 0)}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Campo label="Varejo de (R$)">
                  <input
                    className="field"
                    inputMode="decimal"
                    value={rascunho.retailFrom}
                    onChange={(event) =>
                      setRascunhos((atual) => ({
                        ...atual,
                        [modelo.key]: { ...rascunho, retailFrom: event.target.value },
                      }))
                    }
                  />
                </Campo>
                <Campo label="Varejo até (R$)">
                  <input
                    className="field"
                    inputMode="decimal"
                    value={rascunho.retailTo}
                    onChange={(event) =>
                      setRascunhos((atual) => ({
                        ...atual,
                        [modelo.key]: { ...rascunho, retailTo: event.target.value },
                      }))
                    }
                  />
                </Campo>
              </div>

              <h4 className="field-label mt-5 block">Faixas de atacado</h4>
              <div className="space-y-3">
                {rascunho.tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-2xl border-[3px] border-dashed border-navy/20 p-3 sm:grid-cols-[1fr_5rem_5rem_7rem]"
                  >
                    <input
                      className="field !py-2 !text-sm"
                      aria-label={`Nome da faixa ${index + 1}`}
                      value={tier.label}
                      onChange={(event) => {
                        const tiers = [...rascunho.tiers];
                        tiers[index] = { ...tier, label: event.target.value };
                        setRascunhos((atual) => ({
                          ...atual,
                          [modelo.key]: { ...rascunho, tiers },
                        }));
                      }}
                    />
                    <input
                      className="field !py-2 !text-sm"
                      inputMode="numeric"
                      aria-label={`Quantidade inicial da faixa ${index + 1}`}
                      value={tier.min}
                      onChange={(event) => {
                        const tiers = [...rascunho.tiers];
                        tiers[index] = { ...tier, min: event.target.value };
                        setRascunhos((atual) => ({
                          ...atual,
                          [modelo.key]: { ...rascunho, tiers },
                        }));
                      }}
                    />
                    <input
                      className="field !py-2 !text-sm"
                      inputMode="numeric"
                      aria-label={`Quantidade final da faixa ${index + 1}`}
                      value={tier.max}
                      onChange={(event) => {
                        const tiers = [...rascunho.tiers];
                        tiers[index] = { ...tier, max: event.target.value };
                        setRascunhos((atual) => ({
                          ...atual,
                          [modelo.key]: { ...rascunho, tiers },
                        }));
                      }}
                    />
                    <input
                      className="field !py-2 !text-sm"
                      inputMode="decimal"
                      aria-label={`Preço por unidade da faixa ${index + 1}`}
                      value={tier.unit}
                      onChange={(event) => {
                        const tiers = [...rascunho.tiers];
                        tiers[index] = { ...tier, unit: event.target.value };
                        setRascunhos((atual) => ({
                          ...atual,
                          [modelo.key]: { ...rascunho, tiers },
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-navy/55">
                Ordem dos campos: nome da faixa · quantidade de · quantidade até ·
                preço por unidade.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary !px-4 !py-2 !text-sm"
                  disabled={salvarModelo.isPending}
                  onClick={() => void salvar(modelo)}
                >
                  {salvarModelo.isPending ? (
                    <>
                      <Spinner /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Salvar preços
                    </>
                  )}
                </button>
                {modelo.editado ? (
                  <button
                    type="button"
                    className="btn btn-ghost !px-4 !py-2 !text-sm"
                    disabled={resetar.isPending}
                    onClick={() => void voltarAoPadrao(modelo)}
                  >
                    <RotateCcw className="size-4" /> Voltar ao padrão
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
