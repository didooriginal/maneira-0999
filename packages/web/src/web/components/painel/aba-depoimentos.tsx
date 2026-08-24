import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  useAddTestimonial,
  useAdminTestimonials,
  useRemoveTestimonial,
  useUpdateTestimonial,
} from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";

type Depoimento = {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
};

const vazio = { name: "", role: "", quote: "", rating: 5 };

export function AbaDepoimentos({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const depoimentos = useAdminTestimonials(password);
  const addItem = useAddTestimonial();
  const updateItem = useUpdateTestimonial();
  const removeItem = useRemoveTestimonial();

  const [novo, setNovo] = useState(vazio);
  const [edicoes, setEdicoes] = useState<Record<number, Depoimento>>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await depoimentos.refetch();
  }

  async function adicionar() {
    setAviso(null);
    if (novo.name.trim().length < 2 || novo.role.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Preencha o nome e quem é o cliente." });
      return;
    }
    if (novo.quote.trim().length < 10) {
      setAviso({ tipo: "erro", texto: "O depoimento está curto demais." });
      return;
    }
    try {
      await addItem.mutateAsync({
        password,
        name: novo.name.trim(),
        role: novo.role.trim(),
        quote: novo.quote.trim(),
        rating: novo.rating,
      });
      setNovo(vazio);
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Depoimento publicado no site." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function salvar(id: number) {
    const edicao = edicoes[id];
    if (!edicao) return;
    setAviso(null);
    try {
      await updateItem.mutateAsync({
        password,
        id,
        name: edicao.name.trim(),
        role: edicao.role.trim(),
        quote: edicao.quote.trim(),
        rating: edicao.rating,
      });
      setEdicoes((atual) => {
        const copia = { ...atual };
        delete copia[id];
        return copia;
      });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Depoimento atualizado." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function remover(item: Depoimento) {
    if (!window.confirm(`Remover o depoimento de ${item.name}?`)) return;
    setAviso(null);
    try {
      await removeItem.mutateAsync({ password, id: item.id });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Depoimento removido." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  const lista = (depoimentos.data ?? []) as Depoimento[];

  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">Depoimentos</h2>
      <Aviso tipo="info">
        Publique só depoimento de cliente de verdade, com o que ele realmente
        falou. Cliente inventado é o tipo de coisa que derruba a confiança da
        loja se alguém perceber.
      </Aviso>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <div className="sticker mt-6 p-5">
        <h3 className="font-display text-lg font-extrabold">Novo depoimento</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Nome do cliente">
            <input
              className="field"
              value={novo.name}
              onChange={(event) => setNovo({ ...novo, name: event.target.value })}
            />
          </Campo>
          <Campo label="Quem é" hint='Ex.: "Formanda de Pedagogia", "RH da Alpha".'>
            <input
              className="field"
              value={novo.role}
              onChange={(event) => setNovo({ ...novo, role: event.target.value })}
            />
          </Campo>
          <Campo label="O que o cliente falou" className="sm:col-span-2">
            <textarea
              className="field min-h-28"
              value={novo.quote}
              onChange={(event) => setNovo({ ...novo, quote: event.target.value })}
            />
          </Campo>
          <Campo label="Estrelas">
            <select
              className="field"
              value={novo.rating}
              onChange={(event) =>
                setNovo({ ...novo, rating: Number(event.target.value) })
              }
            >
              {[5, 4, 3, 2, 1].map((valor) => (
                <option key={valor} value={valor}>
                  {valor} {valor === 1 ? "estrela" : "estrelas"}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <button
          type="button"
          className="btn btn-primary mt-5"
          disabled={addItem.isPending}
          onClick={() => void adicionar()}
        >
          {addItem.isPending ? (
            <>
              <Spinner /> Publicando...
            </>
          ) : (
            <>
              <Plus className="size-4" /> Publicar depoimento
            </>
          )}
        </button>
      </div>

      {depoimentos.isLoading ? (
        <p className="mt-6 text-navy/60">Carregando depoimentos...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {lista.map((item) => {
            const edicao = edicoes[item.id] ?? item;
            const mudou = Boolean(edicoes[item.id]);
            return (
              <article key={item.id} className="sticker p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Nome">
                    <input
                      className="field !py-2 !text-sm"
                      value={edicao.name}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: { ...edicao, name: event.target.value },
                        }))
                      }
                    />
                  </Campo>
                  <Campo label="Quem é">
                    <input
                      className="field !py-2 !text-sm"
                      value={edicao.role}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: { ...edicao, role: event.target.value },
                        }))
                      }
                    />
                  </Campo>
                  <Campo label="Depoimento" className="sm:col-span-2">
                    <textarea
                      className="field min-h-24 !text-sm"
                      value={edicao.quote}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: { ...edicao, quote: event.target.value },
                        }))
                      }
                    />
                  </Campo>
                  <Campo label="Estrelas">
                    <select
                      className="field !py-2 !text-sm"
                      value={edicao.rating}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: {
                            ...edicao,
                            rating: Number(event.target.value),
                          },
                        }))
                      }
                    >
                      {[5, 4, 3, 2, 1].map((valor) => (
                        <option key={valor} value={valor}>
                          {valor}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary !px-4 !py-2 !text-sm"
                    disabled={!mudou || updateItem.isPending}
                    onClick={() => void salvar(item.id)}
                  >
                    <Save className="size-4" /> Salvar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost !px-4 !py-2 !text-sm"
                    disabled={removeItem.isPending}
                    onClick={() => void remover(item)}
                  >
                    <Trash2 className="size-4" /> Remover
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
