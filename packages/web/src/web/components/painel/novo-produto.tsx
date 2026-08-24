import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { useAdminCategories, useCreateProduct } from "../../queries/admin";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";
import { UploadFoto } from "./upload-foto";

/**
 * Cadastro de produto novo pelo painel — sem precisar de programador.
 *
 * O endereço (slug) é gerado no servidor a partir do nome, com sufixo numérico
 * se já existir, então nunca sobrescreve a URL de um produto que já está no ar.
 */

type Form = {
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  comparePrice: string;
  image: string;
  categorySlug: string;
  badge: string;
  featured: boolean;
  hidden: boolean;
  highlights: string;
};

const VAZIO: Form = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  comparePrice: "",
  image: "",
  categorySlug: "",
  badge: "",
  featured: false,
  hidden: false,
  highlights: "",
};

export function NovoProduto({
  password,
  onCriado,
}: {
  password: string;
  onCriado: () => Promise<void> | void;
}) {
  const categorias = useAdminCategories(password);
  const criar = useCreateProduct();

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Form>(VAZIO);
  const [aviso, setAviso] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);

  const lista = (categorias.data ?? []) as { slug: string; name: string }[];
  const categoriaEscolhida = form.categorySlug || lista[0]?.slug || "";

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar() {
    setAviso(null);

    const price = Number(form.price.replace(",", "."));
    const compare = form.comparePrice.trim()
      ? Number(form.comparePrice.replace(",", "."))
      : null;

    if (form.name.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Escreva o nome do produto." });
      return;
    }
    if (form.shortDescription.trim().length < 5) {
      setAviso({
        tipo: "erro",
        texto: "A descrição curta é o que aparece no cartão — escreva uma frase.",
      });
      return;
    }
    if (form.description.trim().length < 5) {
      setAviso({
        tipo: "erro",
        texto: "Escreva a descrição completa, que aparece na página do produto.",
      });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setAviso({ tipo: "erro", texto: "O preço tem que ser maior que zero." });
      return;
    }
    if (compare !== null && (!Number.isFinite(compare) || compare <= 0)) {
      setAviso({
        tipo: "erro",
        texto: 'O "preço antes" tem que ser maior que zero (ou vazio).',
      });
      return;
    }
    if (!form.image) {
      setAviso({ tipo: "erro", texto: "Envie a foto do produto." });
      return;
    }
    if (!categoriaEscolhida) {
      setAviso({ tipo: "erro", texto: "Escolha a categoria." });
      return;
    }

    const highlights = form.highlights
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha.length >= 2)
      .slice(0, 8);

    try {
      const resultado = await criar.mutateAsync({
        password,
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        price,
        comparePrice: compare,
        image: form.image,
        categorySlug: categoriaEscolhida,
        badge: form.badge.trim() || null,
        featured: form.featured,
        hidden: form.hidden,
        highlights,
      });
      await onCriado();
      setForm(VAZIO);
      setAberto(false);
      setAviso({
        tipo: "ok",
        texto: `Produto criado! Ele está no catálogo e a página dele é canecamaneira.com.br/caneca/${resultado.slug}`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={aberto ? "btn btn-ghost" : "btn btn-primary"}
          onClick={() => {
            setAberto((v) => !v);
            setAviso(null);
          }}
        >
          {aberto ? (
            <>
              <X className="size-4" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="size-4" /> Adicionar produto
            </>
          )}
        </button>
        {!aberto ? (
          <span className="text-xs text-navy/60">
            Cadastre uma caneca, camisa ou azulejo novo você mesmo.
          </span>
        ) : null}
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {aberto ? (
        <div className="sticker mt-4 p-5">
          <h3 className="font-display text-lg font-extrabold">
            Produto novo
          </h3>
          <p className="mt-1 text-xs text-navy/60">
            O endereço da página é criado sozinho a partir do nome. Se quiser
            preparar com calma, marque <strong>Começar oculto</strong> e mostre
            depois na lista abaixo.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo label="Nome">
              <input
                className="field"
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="Caneca Gamer"
              />
            </Campo>

            <Campo label="Categoria">
              <select
                className="field"
                value={categoriaEscolhida}
                onChange={(event) => set("categorySlug", event.target.value)}
              >
                {lista.map((categoria) => (
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
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
                placeholder="45"
              />
            </Campo>

            <Campo
              label="Preço antes (R$)"
              hint="Deixe vazio se não quiser mostrar preço riscado."
            >
              <input
                className="field"
                inputMode="decimal"
                value={form.comparePrice}
                onChange={(event) => set("comparePrice", event.target.value)}
              />
            </Campo>

            <Campo
              label="Selo"
              hint='Texto curto no cartão, tipo "Novidade".'
            >
              <input
                className="field"
                value={form.badge}
                onChange={(event) => set("badge", event.target.value)}
              />
            </Campo>

            <div className="flex flex-col justify-end gap-2 pb-2">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="size-5 accent-magenta"
                  checked={form.featured}
                  onChange={(event) => set("featured", event.target.checked)}
                />
                Mostrar entre os destaques da home
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="size-5 accent-magenta"
                  checked={form.hidden}
                  onChange={(event) => set("hidden", event.target.checked)}
                />
                Começar oculto (não aparece no site)
              </label>
            </div>

            <Campo label="Descrição curta" className="sm:col-span-2">
              <input
                className="field"
                value={form.shortDescription}
                onChange={(event) =>
                  set("shortDescription", event.target.value)
                }
                placeholder="Caneca de porcelana com a arte do seu jogo favorito."
              />
            </Campo>

            <Campo label="Descrição completa" className="sm:col-span-2">
              <textarea
                className="field min-h-32"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
              />
            </Campo>

            <Campo
              label="Vantagens"
              hint="Uma por linha, até 8. Aparecem em lista na página do produto."
              className="sm:col-span-2"
            >
              <textarea
                className="field min-h-24"
                value={form.highlights}
                onChange={(event) => set("highlights", event.target.value)}
                placeholder={"Porcelana de primeira\nArte que não desbota\nPronta em 2 dias úteis"}
              />
            </Campo>

            <div className="sm:col-span-2">
              <UploadFoto
                password={password}
                atual={form.image}
                onEnviado={(publicUrl) => set("image", publicUrl)}
                label="Foto do produto"
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary mt-5"
            disabled={criar.isPending}
            onClick={() => void salvar()}
          >
            {criar.isPending ? (
              <>
                <Spinner /> Criando...
              </>
            ) : (
              <>
                <Save className="size-4" /> Criar produto
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
