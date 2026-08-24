import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Save, X } from "lucide-react";
import {
  useAdminProducts,
  useReorderProducts,
  useUpdateProduct,
} from "../../queries/admin";
import { useCategories } from "../../queries/catalog";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, BotoesOrdem, Campo, brl, mensagemDeErro, mover } from "./bits";
import { UploadFoto } from "./upload-foto";
import { NovoProduto } from "./novo-produto";

type Produto = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  comparePrice: number | null;
  image: string;
  categorySlug: string;
  badge: string | null;
  featured: boolean;
  hidden: boolean;
};

type Rascunho = {
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  image: string;
  categorySlug: string;
  badge: string;
  featured: boolean;
};

function paraRascunho(produto: Produto): Rascunho {
  return {
    name: produto.name,
    shortDescription: produto.shortDescription,
    description: produto.description,
    price: String(produto.price),
    comparePrice: produto.comparePrice ? String(produto.comparePrice) : "",
    image: produto.image,
    categorySlug: produto.categorySlug,
    badge: produto.badge ?? "",
    featured: produto.featured,
  };
}

export function AbaProdutos({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const produtos = useAdminProducts(password);
  const categorias = useCategories();
  const updateProduct = useUpdateProduct();
  const reorder = useReorderProducts();

  const [ordem, setOrdem] = useState<Produto[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );

  useEffect(() => {
    if (produtos.data) setOrdem(produtos.data as Produto[]);
  }, [produtos.data]);

  /** O site lê de catalog.*, então precisa recarregar depois de qualquer edição. */
  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await produtos.refetch();
  }

  async function salvar(id: number) {
    if (!rascunho) return;
    setAviso(null);

    const price = Number(rascunho.price.replace(",", "."));
    const compare = rascunho.comparePrice.trim()
      ? Number(rascunho.comparePrice.replace(",", "."))
      : null;

    if (!Number.isFinite(price) || price <= 0) {
      setAviso({ tipo: "erro", texto: "O preço tem que ser um número maior que zero." });
      return;
    }
    if (compare !== null && (!Number.isFinite(compare) || compare <= 0)) {
      setAviso({
        tipo: "erro",
        texto: 'O "preço antes" tem que ser um número maior que zero (ou vazio).',
      });
      return;
    }

    try {
      await updateProduct.mutateAsync({
        password,
        id,
        name: rascunho.name.trim(),
        shortDescription: rascunho.shortDescription.trim(),
        description: rascunho.description.trim(),
        price,
        comparePrice: compare,
        image: rascunho.image,
        categorySlug: rascunho.categorySlug,
        badge: rascunho.badge.trim() || null,
        featured: rascunho.featured,
      });
      await atualizarTudo();
      setEditando(null);
      setRascunho(null);
      setAviso({ tipo: "ok", texto: "Produto salvo. Já está no site." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function alternarVisibilidade(produto: Produto) {
    setAviso(null);
    try {
      await updateProduct.mutateAsync({
        password,
        id: produto.id,
        hidden: !produto.hidden,
      });
      await atualizarTudo();
      setAviso({
        tipo: "ok",
        texto: produto.hidden
          ? `"${produto.name}" voltou a aparecer no site.`
          : `"${produto.name}" saiu do site, mas continua guardado aqui.`,
      });
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
      await produtos.refetch();
    }
  }

  if (produtos.isLoading) {
    return <p className="text-navy/60">Carregando produtos...</p>;
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">Produtos do site</h2>
      <p className="mt-2 max-w-2xl text-sm text-navy/65">
        Edite nome, descrição, preço, categoria e foto. Para tirar um produto do
        ar use <strong>Ocultar</strong> — nada é apagado, você pode mostrar de
        volta quando quiser. As setas mudam a ordem em que aparecem no catálogo.
      </p>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      <NovoProduto password={password} onCriado={atualizarTudo} />

      <div className="mt-6 space-y-4">
        {ordem.map((produto, index) => {
          const aberto = editando === produto.id;
          return (
            <article
              key={produto.id}
              className={`sticker p-4 ${produto.hidden ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                  <img
                    src={produto.image}
                    alt={produto.name}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-40 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-display text-lg">
                      {produto.name}
                    </strong>
                    {produto.hidden ? (
                      <span className="tag bg-navy/15">Oculto</span>
                    ) : null}
                    {produto.featured ? (
                      <span className="tag bg-yellow">Destaque</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-navy/60">
                    {brl(produto.price)} · {produto.categorySlug}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <BotoesOrdem
                    primeiro={index === 0}
                    ultimo={index === ordem.length - 1}
                    disabled={reorder.isPending}
                    onUp={() => void reordenar(index, index - 1)}
                    onDown={() => void reordenar(index, index + 1)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost !px-3 !py-2 !text-sm"
                    disabled={updateProduct.isPending}
                    onClick={() => void alternarVisibilidade(produto)}
                  >
                    {produto.hidden ? (
                      <>
                        <Eye className="size-4" /> Mostrar
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-4" /> Ocultar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-blue !px-3 !py-2 !text-sm"
                    onClick={() => {
                      if (aberto) {
                        setEditando(null);
                        setRascunho(null);
                        return;
                      }
                      setEditando(produto.id);
                      setRascunho(paraRascunho(produto));
                      setAviso(null);
                    }}
                  >
                    {aberto ? (
                      <>
                        <X className="size-4" /> Fechar
                      </>
                    ) : (
                      <>
                        <Pencil className="size-4" /> Editar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aberto && rascunho ? (
                <div className="mt-5 border-t-[3px] border-dashed border-navy/20 pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Nome">
                      <input
                        className="field"
                        value={rascunho.name}
                        onChange={(event) =>
                          setRascunho({ ...rascunho, name: event.target.value })
                        }
                      />
                    </Campo>

                    <Campo label="Categoria">
                      <select
                        className="field"
                        value={rascunho.categorySlug}
                        onChange={(event) =>
                          setRascunho({
                            ...rascunho,
                            categorySlug: event.target.value,
                          })
                        }
                      >
                        {(categorias.data ?? []).map((categoria) => (
                          <option key={categoria.slug} value={categoria.slug}>
                            {categoria.name}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <Campo label="Preço (R$)">
                      <input
                        className="field"
                        inputMode="decimal"
                        value={rascunho.price}
                        onChange={(event) =>
                          setRascunho({ ...rascunho, price: event.target.value })
                        }
                      />
                    </Campo>

                    <Campo
                      label="Preço antes (R$)"
                      hint="Deixe vazio se não quiser mostrar preço riscado."
                    >
                      <input
                        className="field"
                        inputMode="decimal"
                        value={rascunho.comparePrice}
                        onChange={(event) =>
                          setRascunho({
                            ...rascunho,
                            comparePrice: event.target.value,
                          })
                        }
                      />
                    </Campo>

                    <Campo
                      label="Selo"
                      hint='Texto curto no cartão, tipo "Mais vendida".'
                    >
                      <input
                        className="field"
                        value={rascunho.badge}
                        onChange={(event) =>
                          setRascunho({ ...rascunho, badge: event.target.value })
                        }
                      />
                    </Campo>

                    <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        className="size-5 accent-magenta"
                        checked={rascunho.featured}
                        onChange={(event) =>
                          setRascunho({
                            ...rascunho,
                            featured: event.target.checked,
                          })
                        }
                      />
                      Mostrar entre os destaques da home
                    </label>

                    <Campo label="Descrição curta" className="sm:col-span-2">
                      <input
                        className="field"
                        value={rascunho.shortDescription}
                        onChange={(event) =>
                          setRascunho({
                            ...rascunho,
                            shortDescription: event.target.value,
                          })
                        }
                      />
                    </Campo>

                    <Campo label="Descrição completa" className="sm:col-span-2">
                      <textarea
                        className="field min-h-32"
                        value={rascunho.description}
                        onChange={(event) =>
                          setRascunho({
                            ...rascunho,
                            description: event.target.value,
                          })
                        }
                      />
                    </Campo>

                    <div className="sm:col-span-2">
                      <UploadFoto
                        password={password}
                        atual={rascunho.image}
                        onEnviado={(publicUrl) =>
                          setRascunho({ ...rascunho, image: publicUrl })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary mt-5"
                    disabled={updateProduct.isPending}
                    onClick={() => void salvar(produto.id)}
                  >
                    {updateProduct.isPending ? (
                      <>
                        <Spinner /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" /> Salvar produto
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
