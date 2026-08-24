import { useSyncExternalStore } from "react";

/**
 * Sacola dos modelos prontos.
 *
 * Guarda só o código do modelo e a quantidade no `localStorage` — nome, preço
 * e disponibilidade vêm sempre do servidor na hora de fechar (`ready.checkBag`),
 * então uma sacola velha nunca leva preço errado para o WhatsApp.
 *
 * Não usa Context de propósito: o botão do topo e a gaveta ficam em pontos
 * diferentes da árvore e precisam do mesmo estado sem embrulhar o site inteiro.
 */

const STORAGE_KEY = "caneca-maneira:sacola:v1";

export interface ItemSacola {
  slug: string;
  quantity: number;
}

let itens: ItemSacola[] = ler();
const ouvintes = new Set<() => void>();

function ler(): ItemSacola[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        slug: String(item?.slug ?? ""),
        quantity: Math.min(999, Math.max(1, Number(item?.quantity) || 1)),
      }))
      .filter((item) => item.slug.length > 0)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function gravar(novos: ItemSacola[]) {
  itens = novos;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  } catch {
    /* modo privado do navegador: a sacola vale só nesta aba */
  }
  for (const ouvinte of ouvintes) ouvinte();
}

function subscribe(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  // Duas abas abertas continuam com a mesma sacola.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      itens = ler();
      ouvinte();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("storage", onStorage);
  };
}

export const sacola = {
  itens: () => itens,

  /** Soma 1 (ou a quantidade pedida) e devolve o total de peças na sacola. */
  adicionar(slug: string, quantity = 1) {
    const atual = itens.find((item) => item.slug === slug);
    if (atual) {
      gravar(
        itens.map((item) =>
          item.slug === slug
            ? { ...item, quantity: Math.min(999, item.quantity + quantity) }
            : item,
        ),
      );
    } else {
      gravar([...itens, { slug, quantity: Math.max(1, quantity) }]);
    }
    return itens.reduce((soma, item) => soma + item.quantity, 0);
  },

  definir(slug: string, quantity: number) {
    if (quantity <= 0) {
      sacola.remover(slug);
      return;
    }
    gravar(
      itens.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.min(999, Math.round(quantity)) }
          : item,
      ),
    );
  },

  remover(slug: string) {
    gravar(itens.filter((item) => item.slug !== slug));
  },

  limpar() {
    gravar([]);
  },
};

/** Estado da sacola pronto para usar em componente. */
export function useSacola() {
  const lista = useSyncExternalStore(subscribe, sacola.itens, () => itens);
  const pecas = lista.reduce((soma, item) => soma + item.quantity, 0);
  // sacola espalhada primeiro: `itens` aqui é a lista do render, não o getter.
  return { ...sacola, itens: lista, pecas };
}
