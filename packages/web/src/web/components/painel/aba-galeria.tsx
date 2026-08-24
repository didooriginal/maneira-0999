import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  useAddGalleryItem,
  useAdminGallery,
  useRemoveGalleryItem,
  useReorderGallery,
  useUpdateGalleryItem,
} from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, BotoesOrdem, Campo, mensagemDeErro, mover } from "./bits";
import { UploadFoto } from "./upload-foto";

type Item = { id: number; title: string; tag: string; image: string };

export function AbaGaleria({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const galeria = useAdminGallery(password);
  const addItem = useAddGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const removeItem = useRemoveGalleryItem();
  const reorder = useReorderGallery();

  const [ordem, setOrdem] = useState<Item[]>([]);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );
  const [novo, setNovo] = useState({ title: "", tag: "", image: "" });
  const [edicoes, setEdicoes] = useState<Record<number, { title: string; tag: string }>>(
    {},
  );

  useEffect(() => {
    if (galeria.data) setOrdem(galeria.data as Item[]);
  }, [galeria.data]);

  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await galeria.refetch();
  }

  async function adicionar() {
    setAviso(null);
    if (novo.title.trim().length < 2 || novo.tag.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Preencha o título e a etiqueta." });
      return;
    }
    if (!novo.image) {
      setAviso({ tipo: "erro", texto: "Envie a foto antes de adicionar." });
      return;
    }
    try {
      await addItem.mutateAsync({
        password,
        title: novo.title.trim(),
        tag: novo.tag.trim(),
        image: novo.image,
      });
      setNovo({ title: "", tag: "", image: "" });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Foto adicionada à galeria." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function salvar(item: Item) {
    const edicao = edicoes[item.id];
    if (!edicao) return;
    setAviso(null);
    try {
      await updateItem.mutateAsync({
        password,
        id: item.id,
        title: edicao.title.trim(),
        tag: edicao.tag.trim(),
      });
      setEdicoes((atual) => {
        const copia = { ...atual };
        delete copia[item.id];
        return copia;
      });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Legenda atualizada." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function remover(item: Item) {
    if (!window.confirm(`Remover "${item.title}" da galeria?`)) return;
    setAviso(null);
    try {
      await removeItem.mutateAsync({ password, id: item.id });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Foto removida da galeria." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function reordenar(index: number, destino: number) {
    const nova = mover(ordem, index, destino);
    if (nova === ordem) return;
    setOrdem(nova);
    try {
      await reorder.mutateAsync({ password, ids: nova.map((item) => item.id) });
      await atualizarTudo();
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
      await galeria.refetch();
    }
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">Galeria</h2>
      <p className="mt-2 max-w-2xl text-sm text-navy/65">
        As fotos de trabalhos prontos que aparecem na home, no formulário de
        pedido e no meio dos modelos em <strong>Modelos que já fizemos</strong>.
        Dá para subir foto direto do celular.
      </p>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <div className="sticker mt-6 p-5">
        <h3 className="font-display text-lg font-extrabold">Adicionar foto</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo label="Título" hint='Ex.: "Caneca da turma de 2026".'>
            <input
              className="field"
              value={novo.title}
              onChange={(event) => setNovo({ ...novo, title: event.target.value })}
            />
          </Campo>
          <Campo label="Etiqueta" hint='Ex.: "Formatura", "Empresa", "Aniversário".'>
            <input
              className="field"
              value={novo.tag}
              onChange={(event) => setNovo({ ...novo, tag: event.target.value })}
            />
          </Campo>
          <div className="sm:col-span-2">
            <UploadFoto
              password={password}
              atual={novo.image || null}
              onEnviado={(publicUrl) => setNovo({ ...novo, image: publicUrl })}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary mt-5"
          disabled={addItem.isPending}
          onClick={() => void adicionar()}
        >
          {addItem.isPending ? (
            <>
              <Spinner /> Adicionando...
            </>
          ) : (
            <>
              <Plus className="size-4" /> Adicionar à galeria
            </>
          )}
        </button>
      </div>

      {galeria.isLoading ? (
        <p className="mt-6 text-navy/60">Carregando galeria...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {ordem.map((item, index) => {
            const edicao = edicoes[item.id];
            return (
              <article key={item.id} className="sticker p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="grid min-w-40 flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className="field !py-2 !text-sm"
                      aria-label={`Título da foto ${item.title}`}
                      value={edicao ? edicao.title : item.title}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: {
                            title: event.target.value,
                            tag: atual[item.id]?.tag ?? item.tag,
                          },
                        }))
                      }
                    />
                    <input
                      className="field !py-2 !text-sm"
                      aria-label={`Etiqueta da foto ${item.title}`}
                      value={edicao ? edicao.tag : item.tag}
                      onChange={(event) =>
                        setEdicoes((atual) => ({
                          ...atual,
                          [item.id]: {
                            title: atual[item.id]?.title ?? item.title,
                            tag: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BotoesOrdem
                      primeiro={index === 0}
                      ultimo={index === ordem.length - 1}
                      disabled={reorder.isPending}
                      onUp={() => void reordenar(index, index - 1)}
                      onDown={() => void reordenar(index, index + 1)}
                    />
                    {edicao ? (
                      <button
                        type="button"
                        className="btn btn-primary !px-3 !py-2 !text-sm"
                        disabled={updateItem.isPending}
                        onClick={() => void salvar(item)}
                      >
                        <Save className="size-4" /> Salvar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-2 !text-sm"
                      disabled={removeItem.isPending}
                      onClick={() => void remover(item)}
                    >
                      <Trash2 className="size-4" /> Remover
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
