import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useAdminReadyDesigns,
  useCreateReadyDesign,
  useRemoveReadyDesign,
  useReorderReadyDesigns,
  useUpdateReadyDesign,
} from "../../queries/admin";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, BotoesOrdem, Campo, brl, mensagemDeErro, mover } from "./bits";
import { UploadFoto } from "./upload-foto";

/**
 * Aba "Modelos prontos": cadastra a arte que já existe pronta, com fotos,
 * preço, código e a arte digital para estampar.
 *
 * Preço vazio = automático pela tabela de preços (aba Preços). O campo só é
 * preenchido quando esse modelo custa diferente do padrão do tipo.
 */

interface Tipo {
  key: string;
  name: string;
  retailFrom: number;
}

interface Item {
  id: number;
  code: string;
  slug: string;
  name: string;
  description: string;
  productType: string;
  price: number | null;
  comparePrice: number | null;
  category: string;
  images: string[];
  tags: string[];
  featured: boolean;
  soldOut: boolean;
  hidden: boolean;
  internalNote: string | null;
  artUrl: string | null;
  artName: string | null;
  precoFinal: number;
}

/** Campos editáveis, do jeito que ficam no formulário (tudo texto). */
interface Rascunho {
  name: string;
  code: string;
  description: string;
  productType: string;
  price: string;
  comparePrice: string;
  category: string;
  images: string[];
  tags: string;
  featured: boolean;
  soldOut: boolean;
  internalNote: string;
  artUrl: string;
  artName: string;
}

const vazio = (tipo: string): Rascunho => ({
  name: "",
  code: "",
  description: "",
  productType: tipo,
  price: "",
  comparePrice: "",
  category: "",
  images: [],
  tags: "",
  featured: false,
  soldOut: false,
  internalNote: "",
  artUrl: "",
  artName: "",
});

const doItem = (item: Item): Rascunho => ({
  name: item.name,
  code: item.code,
  description: item.description,
  productType: item.productType,
  price: item.price === null ? "" : String(item.price),
  comparePrice: item.comparePrice === null ? "" : String(item.comparePrice),
  category: item.category,
  images: item.images,
  tags: item.tags.join(", "),
  featured: item.featured,
  soldOut: item.soldOut,
  internalNote: item.internalNote ?? "",
  artUrl: item.artUrl ?? "",
  artName: item.artName ?? "",
});

/** "39,90" e "39.90" viram 39.9; vazio vira null (= preço automático). */
function numeroOuNulo(texto: string): number | null {
  const limpo = texto.trim().replace(/\s|R\$/g, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

function listaDeTags(texto: string) {
  return texto
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** Link de download da arte: força salvar em vez de abrir no navegador. */
function linkArte(artUrl: string, artName: string | null) {
  const nome = (artName ?? "arte").trim() || "arte";
  return `${artUrl}?download=${encodeURIComponent(nome)}`;
}

/** Fotos do modelo: sobe várias, remove e escolhe qual é a capa (a primeira). */
function Fotos({
  password,
  images,
  onChange,
}: {
  password: string;
  images: string[];
  onChange: (novas: string[]) => void;
}) {
  return (
    <div>
      <span className="field-label block">Fotos do modelo</span>
      {images.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((foto, index) => (
            <div key={`${foto}-${index}`} className="relative">
              <div className="size-20 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                <img
                  src={foto}
                  alt={`Foto ${index + 1}`}
                  className="size-full object-cover"
                  loading="lazy"
                />
              </div>
              {index === 0 ? (
                <span className="absolute -top-2 left-1 rounded-full border-2 border-navy bg-yellow px-1.5 text-[0.6rem] font-extrabold">
                  capa
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Usar a foto ${index + 1} como capa`}
                  className="absolute -top-2 left-1 rounded-full border-2 border-navy bg-white px-1.5 text-[0.6rem] font-extrabold"
                  onClick={() =>
                    onChange([
                      foto,
                      ...images.filter((_, i) => i !== index),
                    ])
                  }
                >
                  capa?
                </button>
              )}
              <button
                type="button"
                aria-label={`Remover a foto ${index + 1}`}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-[3px] border-navy bg-magenta text-white"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                <X className="size-3" strokeWidth={4} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {images.length < 8 ? (
        <UploadFoto
          password={password}
          label="Adicionar foto"
          atual={null}
          onEnviado={(publicUrl) => onChange([...images, publicUrl])}
        />
      ) : (
        <p className="text-xs text-navy/55">
          São 8 fotos no máximo. Remova uma para subir outra.
        </p>
      )}
    </div>
  );
}

/** Arte digital: um arquivo por modelo, só visível e baixável aqui. */
function Arte({
  password,
  rascunho,
  set,
}: {
  password: string;
  rascunho: Rascunho;
  set: (patch: Partial<Rascunho>) => void;
}) {
  return (
    <div className="rounded-2xl border-[3px] border-dashed border-navy/30 bg-cream p-4">
      <p className="font-display text-sm font-extrabold">
        Arte digital (só a equipe vê)
      </p>
      <p className="mt-1 mb-3 text-xs text-navy/60">
        O arquivo que vai para a impressão: PDF, PNG, JPG ou ZIP, até 12 MB.
        Nunca aparece no site — só nesta tela.
      </p>

      <UploadFoto
        password={password}
        label="Arquivo da arte"
        aceitaArte
        atual={rascunho.artUrl || null}
        onEnviado={(publicUrl, filename) =>
          set({ artUrl: publicUrl, artName: filename })
        }
      />

      {rascunho.artUrl ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={linkArte(rascunho.artUrl, rascunho.artName)}
            className="btn btn-navy !px-3 !py-2 !text-sm"
          >
            <Download className="size-4" />
            Baixar arte
          </a>
          <span className="text-xs break-all text-navy/60">
            {rascunho.artName || "arquivo"}
          </span>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 !text-sm"
            onClick={() => set({ artUrl: "", artName: "" })}
          >
            <Trash2 className="size-4" />
            Tirar arte
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Formulário compartilhado por "novo modelo" e "editar modelo". */
function Formulario({
  password,
  tipos,
  rascunho,
  set,
}: {
  password: string;
  tipos: Tipo[];
  rascunho: Rascunho;
  set: (patch: Partial<Rascunho>) => void;
}) {
  const tipo = tipos.find((item) => item.key === rascunho.productType);
  const manual = numeroOuNulo(rascunho.price);
  const precoMostrado = manual ?? tipo?.retailFrom ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nome do modelo" hint='Ex.: "Caneca Café com Gato".'>
        <input
          className="field"
          value={rascunho.name}
          onChange={(event) => set({ name: event.target.value })}
        />
      </Campo>

      <Campo
        label="Código"
        hint="Deixe vazio que eu crio o próximo (CM-001, CM-002...)."
      >
        <input
          className="field"
          placeholder="CM-001"
          value={rascunho.code}
          onChange={(event) => set({ code: event.target.value })}
        />
      </Campo>

      <Campo label="Tipo de produto" hint="Define o preço automático.">
        <select
          className="field"
          value={rascunho.productType}
          onChange={(event) => set({ productType: event.target.value })}
        >
          {tipos.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name} — {brl(item.retailFrom)}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Categoria" hint='Ex.: "engraçadas", "fé", "profissões".'>
        <input
          className="field"
          value={rascunho.category}
          onChange={(event) => set({ category: event.target.value })}
        />
      </Campo>

      <Campo
        label="Preço"
        hint={
          manual
            ? `Preço próprio deste modelo: ${brl(manual)}.`
            : `Vazio = automático da tabela: ${brl(precoMostrado)}.`
        }
      >
        <input
          className="field"
          inputMode="decimal"
          placeholder={`automático (${brl(tipo?.retailFrom ?? 0)})`}
          value={rascunho.price}
          onChange={(event) => set({ price: event.target.value })}
        />
      </Campo>

      <Campo
        label="Preço antigo (riscado)"
        hint="Só para mostrar desconto. Deixe vazio se não tiver."
      >
        <input
          className="field"
          inputMode="decimal"
          value={rascunho.comparePrice}
          onChange={(event) => set({ comparePrice: event.target.value })}
        />
      </Campo>

      <Campo
        label="Descrição"
        className="sm:col-span-2"
        hint="O que o cliente lê na página do modelo."
      >
        <textarea
          className="field min-h-24"
          value={rascunho.description}
          onChange={(event) => set({ description: event.target.value })}
        />
      </Campo>

      <Campo
        label="Palavras de busca"
        className="sm:col-span-2"
        hint="Separadas por vírgula. Ex.: gato, café, humor, presente."
      >
        <input
          className="field"
          value={rascunho.tags}
          onChange={(event) => set({ tags: event.target.value })}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Fotos
          password={password}
          images={rascunho.images}
          onChange={(images) => set({ images })}
        />
      </div>

      <div className="flex flex-wrap gap-5 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-magenta"
            checked={rascunho.featured}
            onChange={(event) => set({ featured: event.target.checked })}
          />
          Destaque (aparece primeiro, com selo)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-magenta"
            checked={rascunho.soldOut}
            onChange={(event) => set({ soldOut: event.target.checked })}
          />
          Esgotado (fica no site, sem botão de comprar)
        </label>
      </div>

      <Campo
        label="Observação interna"
        className="sm:col-span-2"
        hint="Nunca aparece no site. Ex.: qual caneca usar, onde está o arquivo."
      >
        <textarea
          className="field min-h-16"
          value={rascunho.internalNote}
          onChange={(event) => set({ internalNote: event.target.value })}
        />
      </Campo>

      <div className="sm:col-span-2">
        <Arte password={password} rascunho={rascunho} set={set} />
      </div>
    </div>
  );
}

export function AbaProntos({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const prontos = useAdminReadyDesigns(password);
  const criar = useCreateReadyDesign();
  const atualizar = useUpdateReadyDesign();
  const remover = useRemoveReadyDesign();
  const reorder = useReorderReadyDesigns();

  const tipos: Tipo[] = prontos.data?.tipos ?? [];
  const [ordem, setOrdem] = useState<Item[]>([]);
  const [aviso, setAviso] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);
  const [abrindoNovo, setAbrindoNovo] = useState(false);
  const [novo, setNovo] = useState<Rascunho>(vazio(""));
  const [editando, setEditando] = useState<number | null>(null);
  const [edicao, setEdicao] = useState<Rascunho | null>(null);

  useEffect(() => {
    if (prontos.data) setOrdem(prontos.data.itens as Item[]);
  }, [prontos.data]);

  // O primeiro tipo da tabela é o padrão do formulário novo.
  useEffect(() => {
    if (tipos.length > 0 && !novo.productType) {
      setNovo((atual) => ({ ...atual, productType: tipos[0].key }));
    }
  }, [tipos, novo.productType]);

  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.ready.key() });
    await prontos.refetch();
  }

  async function salvarNovo() {
    setAviso(null);
    if (novo.name.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Escreva o nome do modelo." });
      return;
    }
    if (novo.category.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Escreva a categoria do modelo." });
      return;
    }
    if (novo.images.length === 0) {
      setAviso({ tipo: "erro", texto: "Suba pelo menos uma foto." });
      return;
    }
    try {
      const criado = await criar.mutateAsync({
        password,
        name: novo.name.trim(),
        code: novo.code.trim() || undefined,
        description: novo.description.trim(),
        productType: novo.productType,
        price: numeroOuNulo(novo.price),
        comparePrice: numeroOuNulo(novo.comparePrice),
        category: novo.category.trim(),
        images: novo.images,
        tags: listaDeTags(novo.tags),
        featured: novo.featured,
        soldOut: novo.soldOut,
        internalNote: novo.internalNote.trim(),
        artUrl: novo.artUrl.trim(),
        artName: novo.artName.trim(),
      });
      setNovo(vazio(tipos[0]?.key ?? ""));
      setAbrindoNovo(false);
      await atualizarTudo();
      setAviso({
        tipo: "ok",
        texto: `Modelo ${criado.code} publicado na vitrine.`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function salvarEdicao(item: Item) {
    if (!edicao) return;
    setAviso(null);
    try {
      await atualizar.mutateAsync({
        password,
        id: item.id,
        name: edicao.name.trim(),
        code: edicao.code.trim(),
        description: edicao.description.trim(),
        productType: edicao.productType,
        price: numeroOuNulo(edicao.price),
        comparePrice: numeroOuNulo(edicao.comparePrice),
        category: edicao.category.trim(),
        images: edicao.images,
        tags: listaDeTags(edicao.tags),
        featured: edicao.featured,
        soldOut: edicao.soldOut,
        internalNote: edicao.internalNote.trim() || null,
        artUrl: edicao.artUrl.trim() || null,
        artName: edicao.artName.trim() || null,
      });
      setEditando(null);
      setEdicao(null);
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Modelo atualizado." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function alternarOculto(item: Item) {
    setAviso(null);
    try {
      await atualizar.mutateAsync({
        password,
        id: item.id,
        hidden: !item.hidden,
      });
      await atualizarTudo();
      setAviso({
        tipo: "ok",
        texto: item.hidden
          ? `${item.code} voltou para a vitrine.`
          : `${item.code} saiu da vitrine (o cadastro e a arte ficam aqui).`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function apagar(item: Item) {
    if (
      !window.confirm(
        `Apagar "${item.name}" (${item.code}) de vez? A arte digital também sai daqui. Para só tirar do site, use "Tirar do site".`,
      )
    ) {
      return;
    }
    setAviso(null);
    try {
      await remover.mutateAsync({ password, id: item.id });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: `${item.code} apagado.` });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function reordenar(index: number, destino: number) {
    const nova = mover(ordem, index, destino);
    if (nova === ordem) return;
    setOrdem(nova);
    try {
      await reorder.mutateAsync({ password, ids: nova.map((it) => it.id) });
      await atualizarTudo();
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
      await prontos.refetch();
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">
            Modelos prontos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-navy/65">
            A vitrine de <strong>/prontos</strong>: arte que já existe, com
            preço na tela. O cliente junta o que quer na sacola e manda tudo num
            WhatsApp só. Preço vazio segue a aba <strong>Preços</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/prontos"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost !px-4 !py-2 !text-sm"
          >
            <ExternalLink className="size-4" />
            Ver vitrine
          </a>
          <button
            type="button"
            className="btn btn-primary !px-4 !py-2 !text-sm"
            onClick={() => setAbrindoNovo((v) => !v)}
          >
            <Plus className="size-4" />
            {abrindoNovo ? "Fechar" : "Novo modelo"}
          </button>
        </div>
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {abrindoNovo ? (
        <div className="sticker mt-6 p-5">
          <h3 className="font-display text-lg font-extrabold">Novo modelo</h3>
          <div className="mt-4">
            <Formulario
              password={password}
              tipos={tipos}
              rascunho={novo}
              set={(patch) => setNovo((atual) => ({ ...atual, ...patch }))}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-5"
            disabled={criar.isPending}
            onClick={() => void salvarNovo()}
          >
            {criar.isPending ? (
              <>
                <Spinner /> Publicando...
              </>
            ) : (
              <>
                <Plus className="size-4" /> Publicar na vitrine
              </>
            )}
          </button>
        </div>
      ) : null}

      {prontos.isLoading ? (
        <p className="mt-6 text-navy/60">Carregando modelos...</p>
      ) : ordem.length === 0 ? (
        <p className="mt-6 rounded-2xl border-[3px] border-dashed border-navy/30 bg-cream px-4 py-6 text-center text-sm text-navy/65">
          Nenhum modelo pronto ainda. Clique em <strong>Novo modelo</strong>{" "}
          para colocar a primeira arte na vitrine.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {ordem.map((item, index) => {
            const aberto = editando === item.id;
            return (
              <article key={item.id} className="sticker p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-xs text-navy/50">
                        sem foto
                      </span>
                    )}
                  </div>

                  <div className="min-w-40 flex-1">
                    <p className="font-display font-extrabold">
                      <span className="text-navy/55">{item.code}</span>{" "}
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-navy/65">
                      {brl(item.precoFinal)}
                      {item.price === null ? " (automático)" : " (próprio)"} ·{" "}
                      {item.category} · {item.images.length}{" "}
                      {item.images.length === 1 ? "foto" : "fotos"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {item.hidden ? (
                        <span className="tag bg-magenta/20">fora do site</span>
                      ) : null}
                      {item.soldOut ? (
                        <span className="tag bg-cream">esgotado</span>
                      ) : null}
                      {item.featured ? (
                        <span className="tag bg-yellow">destaque</span>
                      ) : null}
                      {item.artUrl ? (
                        <span className="tag bg-mint">tem arte</span>
                      ) : (
                        <span className="tag bg-white">sem arte</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <BotoesOrdem
                      primeiro={index === 0}
                      ultimo={index === ordem.length - 1}
                      disabled={reorder.isPending}
                      onUp={() => void reordenar(index, index - 1)}
                      onDown={() => void reordenar(index, index + 1)}
                    />
                    {item.artUrl ? (
                      <a
                        href={linkArte(item.artUrl, item.artName)}
                        className="btn btn-navy !px-3 !py-2 !text-sm"
                      >
                        <Download className="size-4" />
                        Arte
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-2 !text-sm"
                      onClick={() => {
                        if (aberto) {
                          setEditando(null);
                          setEdicao(null);
                        } else {
                          setEditando(item.id);
                          setEdicao(doItem(item));
                        }
                      }}
                    >
                      {aberto ? (
                        <>
                          <X className="size-4" /> Fechar
                        </>
                      ) : (
                        "Editar"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-2 !text-sm"
                      disabled={atualizar.isPending}
                      onClick={() => void alternarOculto(item)}
                    >
                      {item.hidden ? (
                        <>
                          <Eye className="size-4" /> Voltar ao site
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-4" /> Tirar do site
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-2 !text-sm"
                      disabled={remover.isPending}
                      onClick={() => void apagar(item)}
                    >
                      <Trash2 className="size-4" /> Apagar
                    </button>
                  </div>
                </div>

                {aberto && edicao ? (
                  <div className="mt-5 border-t-[3px] border-dashed border-navy/20 pt-5">
                    <Formulario
                      password={password}
                      tipos={tipos}
                      rascunho={edicao}
                      set={(patch) =>
                        setEdicao((atual) =>
                          atual ? { ...atual, ...patch } : atual,
                        )
                      }
                    />
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={atualizar.isPending}
                        onClick={() => void salvarEdicao(item)}
                      >
                        {atualizar.isPending ? (
                          <>
                            <Spinner /> Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" /> Salvar alterações
                          </>
                        )}
                      </button>
                      <a
                        href={`/prontos/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost"
                      >
                        <ExternalLink className="size-4" />
                        Ver no site
                      </a>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
