import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useAdminMugTypes,
  useAdminPriceModels,
  useCreateMugType,
  useRemoveMugType,
  useReorderMugTypes,
  useUpdateMugType,
} from "../../queries/admin";
import { useProductLines } from "../../queries/catalog";
import { orpc } from "../../lib/api";
import { Spinner } from "../ui/bits";
import { Aviso, BotoesOrdem, Campo, brl, mensagemDeErro, mover } from "./bits";
import { UploadFoto } from "./upload-foto";

/**
 * Aba "Tipos de caneca": a vitrine de /modelos — que peça existe de verdade
 * (branca, com colher, de chopp, polímero...), com a foto estampada, a foto
 * da peça crua e de quanto sai.
 *
 * Preço vazio = automático pela tabela de preços (aba Preços). Sem tabela e
 * sem valor manual, o site mostra "Preço sob consulta".
 */

interface Item {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  imagePrinted: string;
  imageBlank: string | null;
  priceFrom: number | null;
  priceAuto: boolean;
  priceLabel: string;
  quoteOption: string | null;
  highlights: string[];
  badge: string | null;
  featured: boolean;
  /* Valores crus, só do painel. */
  priceModelKey: string | null;
  priceManual: number | null;
  imagePrintedRaw: string;
  imageBlankRaw: string;
  hidden: boolean;
  sortOrder: number;
}

interface Modelo {
  key: string;
  name: string;
  retailFrom: number;
}

/** Campos editáveis, do jeito que ficam no formulário (tudo texto). */
interface Rascunho {
  name: string;
  subtitle: string;
  description: string;
  imagePrinted: string;
  imageBlank: string;
  priceModelKey: string;
  priceManual: string;
  quoteOption: string;
  highlights: string;
  badge: string;
  featured: boolean;
}

const vazio: Rascunho = {
  name: "",
  subtitle: "",
  description: "",
  imagePrinted: "",
  imageBlank: "",
  priceModelKey: "",
  priceManual: "",
  quoteOption: "",
  highlights: "",
  badge: "",
  featured: false,
};

const doItem = (item: Item): Rascunho => ({
  name: item.name,
  subtitle: item.subtitle,
  description: item.description,
  imagePrinted: item.imagePrintedRaw,
  imageBlank: item.imageBlankRaw,
  priceModelKey: item.priceModelKey ?? "",
  priceManual: item.priceManual === null ? "" : String(item.priceManual),
  quoteOption: item.quoteOption ?? "",
  highlights: item.highlights.join("\n"),
  badge: item.badge ?? "",
  featured: item.featured,
});

/** "39,90" e "39.90" viram 39.9; vazio vira null (= preço automático). */
function numeroOuNulo(texto: string): number | null {
  const limpo = texto.trim().replace(/\s|R\$/g, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

function listaDeLinhas(texto: string) {
  return texto
    .split(/\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** Uma foto só, com botão de tirar. Usado na estampada e na peça crua. */
function Foto({
  password,
  label,
  hint,
  valor,
  onChange,
}: {
  password: string;
  label: string;
  hint: string;
  valor: string;
  onChange: (url: string) => void;
}) {
  return (
    <div>
      <span className="field-label block">{label}</span>
      <p className="mb-2 text-xs text-navy/55">{hint}</p>
      {valor ? (
        <div className="mb-3 flex items-center gap-3">
          <div className="size-20 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
            <img
              src={valor}
              alt={label}
              className="size-full object-cover"
              loading="lazy"
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 !text-sm"
            onClick={() => onChange("")}
          >
            <X className="size-4" /> Tirar foto
          </button>
        </div>
      ) : null}
      <UploadFoto
        password={password}
        label={valor ? "Trocar foto" : "Subir foto"}
        atual={null}
        onEnviado={(publicUrl) => onChange(publicUrl)}
      />
    </div>
  );
}

/** Formulário compartilhado por "novo tipo" e "editar tipo". */
function Formulario({
  password,
  modelos,
  opcoes,
  rascunho,
  set,
}: {
  password: string;
  modelos: Modelo[];
  opcoes: string[];
  rascunho: Rascunho;
  set: (patch: Partial<Rascunho>) => void;
}) {
  const modelo = modelos.find((item) => item.key === rascunho.priceModelKey);
  const manual = numeroOuNulo(rascunho.priceManual);
  const preview = manual
    ? brl(manual)
    : modelo
      ? `a partir de ${brl(modelo.retailFrom)}`
      : "Preço sob consulta";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nome do tipo" hint='Ex.: "Caneca com Colher".'>
        <input
          className="field"
          value={rascunho.name}
          onChange={(event) => set({ name: event.target.value })}
        />
      </Campo>

      <Campo
        label="Frase curta"
        hint="Aparece embaixo do nome, no card. Ex.: “Porcelana branca 325 ml”."
      >
        <input
          className="field"
          value={rascunho.subtitle}
          onChange={(event) => set({ subtitle: event.target.value })}
        />
      </Campo>

      <Campo
        label="Tabela de preços"
        hint="De onde sai o preço automático. Sem tabela, vale só o valor digitado abaixo."
      >
        <select
          className="field"
          value={rascunho.priceModelKey}
          onChange={(event) => set({ priceModelKey: event.target.value })}
        >
          <option value="">Sem tabela — uso preço manual</option>
          {modelos.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name} — {brl(item.retailFrom)}
            </option>
          ))}
        </select>
      </Campo>

      <Campo
        label="Preço no card"
        hint={`Vazio = automático. O site vai mostrar: ${preview}.`}
      >
        <input
          className="field"
          inputMode="decimal"
          placeholder={
            modelo ? `automático (${brl(modelo.retailFrom)})` : "sob consulta"
          }
          value={rascunho.priceManual}
          onChange={(event) => set({ priceManual: event.target.value })}
        />
      </Campo>

      <Campo
        label="Opção no formulário de pedido"
        hint="Quando o cliente clica em “Quero essa”, o pedido já abre com esta opção marcada."
      >
        <select
          className="field"
          value={rascunho.quoteOption}
          onChange={(event) => set({ quoteOption: event.target.value })}
        >
          <option value="">Nenhuma (abre o pedido em branco)</option>
          {opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Selo" hint='Fita colorida no card. Ex.: "mais pedida".'>
        <input
          className="field"
          value={rascunho.badge}
          onChange={(event) => set({ badge: event.target.value })}
        />
      </Campo>

      <Campo
        label="Descrição"
        className="sm:col-span-2"
        hint="Duas ou três linhas explicando a peça."
      >
        <textarea
          className="field min-h-24"
          value={rascunho.description}
          onChange={(event) => set({ description: event.target.value })}
        />
      </Campo>

      <Campo
        label="Detalhes (um por linha)"
        className="sm:col-span-2"
        hint="Até 6. Ex.: 325 ml · Vai ao micro-ondas · Impressão 360°."
      >
        <textarea
          className="field min-h-20"
          value={rascunho.highlights}
          onChange={(event) => set({ highlights: event.target.value })}
        />
      </Campo>

      <Foto
        password={password}
        label="Foto estampada"
        hint="A que o cliente vê primeiro no card."
        valor={rascunho.imagePrinted}
        onChange={(imagePrinted) => set({ imagePrinted })}
      />

      <Foto
        password={password}
        label="Foto da peça crua"
        hint="Sem estampa. Aparece ao passar o mouse ou no botão “ver crua”. Sem esta foto, o botão some."
        valor={rascunho.imageBlank}
        onChange={(imageBlank) => set({ imageBlank })}
      />

      <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
        <input
          type="checkbox"
          className="size-5 accent-magenta"
          checked={rascunho.featured}
          onChange={(event) => set({ featured: event.target.checked })}
        />
        Destaque (card maior, com selo)
      </label>
    </div>
  );
}

export function AbaTipos({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const tipos = useAdminMugTypes(password);
  const precos = useAdminPriceModels(password);
  const linhas = useProductLines();
  const criar = useCreateMugType();
  const atualizar = useUpdateMugType();
  const remover = useRemoveMugType();
  const reorder = useReorderMugTypes();

  const modelos: Modelo[] = (precos.data ?? []).map((item) => ({
    key: item.key,
    name: item.name,
    retailFrom: item.retailFrom,
  }));
  const opcoes =
    linhas.data?.find((linha) => linha.slug === "caneca")?.options ?? [];

  const [ordem, setOrdem] = useState<Item[]>([]);
  const [aviso, setAviso] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);
  const [abrindoNovo, setAbrindoNovo] = useState(false);
  const [novo, setNovo] = useState<Rascunho>(vazio);
  const [editando, setEditando] = useState<number | null>(null);
  const [edicao, setEdicao] = useState<Rascunho | null>(null);

  useEffect(() => {
    if (tipos.data) setOrdem(tipos.data as Item[]);
  }, [tipos.data]);

  async function atualizarTudo() {
    await queryClient.invalidateQueries({ queryKey: orpc.mugTypes.key() });
    await queryClient.invalidateQueries({ queryKey: orpc.catalog.key() });
    await tipos.refetch();
  }

  async function salvarNovo() {
    setAviso(null);
    if (novo.name.trim().length < 2) {
      setAviso({ tipo: "erro", texto: "Escreva o nome do tipo." });
      return;
    }
    try {
      await criar.mutateAsync({
        password,
        name: novo.name.trim(),
        subtitle: novo.subtitle.trim(),
        description: novo.description.trim(),
        imagePrinted: novo.imagePrinted.trim(),
        imageBlank: novo.imageBlank.trim(),
        priceModelKey: novo.priceModelKey,
        priceManual: numeroOuNulo(novo.priceManual),
        quoteOption: novo.quoteOption,
        highlights: listaDeLinhas(novo.highlights),
        badge: novo.badge.trim(),
        featured: novo.featured,
      });
      setNovo(vazio);
      setAbrindoNovo(false);
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Tipo publicado em /modelos." });
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
        subtitle: edicao.subtitle.trim(),
        description: edicao.description.trim(),
        imagePrinted: edicao.imagePrinted.trim(),
        imageBlank: edicao.imageBlank.trim(),
        priceModelKey: edicao.priceModelKey,
        priceManual: numeroOuNulo(edicao.priceManual),
        quoteOption: edicao.quoteOption,
        highlights: listaDeLinhas(edicao.highlights),
        badge: edicao.badge.trim(),
        featured: edicao.featured,
      });
      setEditando(null);
      setEdicao(null);
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: "Tipo atualizado." });
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
          ? `${item.name} voltou para /modelos.`
          : `${item.name} saiu de /modelos (o cadastro fica aqui).`,
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  async function apagar(item: Item) {
    if (
      !window.confirm(
        `Apagar "${item.name}" de vez? Para só tirar do site, use "Tirar do site".`,
      )
    ) {
      return;
    }
    setAviso(null);
    try {
      await remover.mutateAsync({ password, id: item.id });
      await atualizarTudo();
      setAviso({ tipo: "ok", texto: `${item.name} apagado.` });
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
      await tipos.refetch();
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold">
            Tipos de caneca
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-navy/65">
            A página <strong>/modelos</strong>: que peça existe de verdade —
            branca, com colher, de chopp, polímero. Cada card mostra a foto
            estampada e, se você subir, a peça crua. Preço vazio segue a aba{" "}
            <strong>Preços</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/modelos"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost !px-4 !py-2 !text-sm"
          >
            <ExternalLink className="size-4" />
            Ver página
          </a>
          <button
            type="button"
            className="btn btn-primary !px-4 !py-2 !text-sm"
            onClick={() => setAbrindoNovo((v) => !v)}
          >
            <Plus className="size-4" />
            {abrindoNovo ? "Fechar" : "Novo tipo"}
          </button>
        </div>
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {abrindoNovo ? (
        <div className="sticker mt-6 p-5">
          <h3 className="font-display text-lg font-extrabold">Novo tipo</h3>
          <div className="mt-4">
            <Formulario
              password={password}
              modelos={modelos}
              opcoes={opcoes}
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
                <Plus className="size-4" /> Publicar em /modelos
              </>
            )}
          </button>
        </div>
      ) : null}

      {tipos.isLoading ? (
        <p className="mt-6 text-navy/60">Carregando tipos...</p>
      ) : ordem.length === 0 ? (
        <p className="mt-6 rounded-2xl border-[3px] border-dashed border-navy/30 bg-cream px-4 py-6 text-center text-sm text-navy/65">
          Nenhum tipo cadastrado. Clique em <strong>Novo tipo</strong> para
          montar a vitrine.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {ordem.map((item, index) => {
            const aberto = editando === item.id;
            return (
              <article key={item.id} className="sticker p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-navy bg-cream">
                    <img
                      src={item.imagePrinted}
                      alt={item.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-40 flex-1">
                    <p className="font-display font-extrabold">{item.name}</p>
                    <p className="mt-0.5 text-sm text-navy/65">
                      {item.priceLabel}
                      {item.priceFrom === null
                        ? ""
                        : item.priceAuto
                          ? " (automático)"
                          : " (próprio)"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {item.hidden ? (
                        <span className="tag bg-magenta/20">fora do site</span>
                      ) : null}
                      {item.featured ? (
                        <span className="tag bg-yellow">destaque</span>
                      ) : null}
                      {item.imageBlankRaw ? (
                        <span className="tag bg-mint">tem peça crua</span>
                      ) : (
                        <span className="tag bg-white">sem peça crua</span>
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
                      modelos={modelos}
                      opcoes={opcoes}
                      rascunho={edicao}
                      set={(patch) =>
                        setEdicao((atual) =>
                          atual ? { ...atual, ...patch } : atual,
                        )
                      }
                    />
                    <div className="mt-5">
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
