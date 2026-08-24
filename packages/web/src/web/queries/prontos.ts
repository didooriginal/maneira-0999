import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { ItemSacola } from "../lib/sacola";

/** Hooks da vitrine de modelos prontos (/prontos). */

export interface FiltrosProntos {
  category?: string;
  tag?: string;
  search?: string;
  sort?: "destaques" | "menor-preco" | "maior-preco" | "novidades";
}

export function useProntos(filtros: FiltrosProntos = {}) {
  return useQuery(
    orpc.ready.list.queryOptions({ input: filtros, staleTime: 60_000 }),
  );
}

export function useProntosFacets() {
  return useQuery(orpc.ready.facets.queryOptions({ staleTime: 60_000 }));
}

export function usePronto(slug: string) {
  return useQuery(
    orpc.ready.item.queryOptions({
      input: { slug },
      staleTime: 60_000,
      enabled: Boolean(slug),
      retry: false,
    }),
  );
}

/**
 * Confere a sacola no servidor: nome, preço e disponibilidade atuais.
 * Só roda quando tem item — sacola vazia não precisa de rede.
 */
export function useConferirSacola(itens: ItemSacola[]) {
  return useQuery(
    orpc.ready.checkBag.queryOptions({
      input: { items: itens },
      enabled: itens.length > 0,
      staleTime: 30_000,
    }),
  );
}
