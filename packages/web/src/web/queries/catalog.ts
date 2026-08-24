import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export interface ProductFilters {
  category?: string;
  featuredOnly?: boolean;
  search?: string;
  sort?: "relevancia" | "menor-preco" | "maior-preco" | "avaliacao";
}

export function useCategories() {
  return useQuery(
    orpc.catalog.categories.queryOptions({ staleTime: 5 * 60_000 }),
  );
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery(
    orpc.catalog.products.queryOptions({
      input: filters,
      staleTime: 60_000,
    }),
  );
}

export function useProduct(slug: string) {
  return useQuery(
    orpc.catalog.product.queryOptions({
      input: { slug },
      staleTime: 60_000,
      enabled: Boolean(slug),
    }),
  );
}

export function useTestimonials() {
  return useQuery(
    orpc.catalog.testimonials.queryOptions({ staleTime: 5 * 60_000 }),
  );
}

export function useGallery() {
  return useQuery(orpc.catalog.gallery.queryOptions({ staleTime: 5 * 60_000 }));
}

/** Faixa sazonal do topo — null quando não tem campanha valendo hoje. */
export function useActiveBanner() {
  return useQuery(
    orpc.catalog.activeBanner.queryOptions({ staleTime: 5 * 60_000 }),
  );
}

export function useProductLines() {
  return useQuery(orpc.quotes.lines.queryOptions({ staleTime: 10 * 60_000 }));
}

export function useShippingQuote() {
  return useMutation(orpc.shipping.quote.mutationOptions());
}

export function usePriceTiers() {
  return useQuery(
    orpc.quotes.priceTiers.queryOptions({ staleTime: 10 * 60_000 }),
  );
}

export function useModelEstimate(modelKey: string, quantity: number) {
  return useQuery(
    orpc.quotes.estimateModel.queryOptions({
      input: { modelKey, quantity },
      staleTime: 10 * 60_000,
      enabled: Boolean(modelKey) && quantity >= 1,
    }),
  );
}

export function useCreateQuote() {
  return useMutation(orpc.quotes.create.mutationOptions());
}

/** Topo da home (foto, títulos e selinhos) — vem do painel. */
export function useHero() {
  return useQuery(orpc.catalog.hero.queryOptions({ staleTime: 5 * 60_000 }));
}

/** Popup de novidade. Devolve null quando está desligado ou fora do período. */
export function usePopup() {
  return useQuery(orpc.catalog.popup.queryOptions({ staleTime: 5 * 60_000 }));
}

/** Nota do Google da home (nota, quantidade e link, editáveis no painel). */
export function useAvaliacoes() {
  return useQuery(
    orpc.catalog.avaliacoes.queryOptions({ staleTime: 5 * 60_000 }),
  );
}
