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

export function useShippingOptions() {
  return useQuery(
    orpc.checkout.shippingOptions.queryOptions({ staleTime: 10 * 60_000 }),
  );
}

export function usePriceTiers() {
  return useQuery(
    orpc.quotes.priceTiers.queryOptions({ staleTime: 10 * 60_000 }),
  );
}

export function useCreateOrder() {
  return useMutation(orpc.checkout.createOrder.mutationOptions());
}

export function useCreateQuote() {
  return useMutation(orpc.quotes.create.mutationOptions());
}
