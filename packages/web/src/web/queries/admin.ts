import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Hooks do painel interno — todas as chamadas mandam a senha para o servidor. */

export function useAdminLogin() {
  return useMutation(orpc.admin.login.mutationOptions());
}

/** Troca a senha do painel (confere a atual no servidor). */
export function useChangePassword() {
  return useMutation(orpc.admin.changePassword.mutationOptions());
}

export function useAdminSummary(password: string) {
  return useQuery(
    orpc.admin.summary.queryOptions({
      input: { password },
      enabled: Boolean(password),
      staleTime: 15_000,
    }),
  );
}

export function useAdminQuotes(password: string) {
  return useQuery(
    orpc.admin.quotes.queryOptions({
      input: { password },
      enabled: Boolean(password),
      staleTime: 15_000,
    }),
  );
}

export function useSetQuoteStatus() {
  return useMutation(orpc.admin.setQuoteStatus.mutationOptions());
}

/** Marca (ou desmarca) que o cliente já foi cutucado no WhatsApp. */
export function useNudgeQuote() {
  return useMutation(orpc.admin.nudgeQuote.mutationOptions());
}

export function useSetQuoteFinalArt() {
  return useMutation(orpc.admin.setQuoteFinalArt.mutationOptions());
}

export function useRemoveQuote() {
  return useMutation(orpc.admin.removeQuote.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Produtos — editar e ocultar (nunca apagar)
 * ---------------------------------------------------------------- */

export function useAdminProducts(password: string, enabled = true) {
  return useQuery(
    orpc.admin.products.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useAdminCategories(password: string, enabled = true) {
  return useQuery(
    orpc.admin.categories.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useCreateProduct() {
  return useMutation(orpc.admin.createProduct.mutationOptions());
}

export function useUpdateProduct() {
  return useMutation(orpc.admin.updateProduct.mutationOptions());
}

export function useReorderProducts() {
  return useMutation(orpc.admin.reorderProducts.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Galeria
 * ---------------------------------------------------------------- */

export function useAdminGallery(password: string, enabled = true) {
  return useQuery(
    orpc.admin.gallery.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useAddGalleryItem() {
  return useMutation(orpc.admin.addGalleryItem.mutationOptions());
}

export function useUpdateGalleryItem() {
  return useMutation(orpc.admin.updateGalleryItem.mutationOptions());
}

export function useRemoveGalleryItem() {
  return useMutation(orpc.admin.removeGalleryItem.mutationOptions());
}

export function useReorderGallery() {
  return useMutation(orpc.admin.reorderGallery.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Depoimentos
 * ---------------------------------------------------------------- */

export function useAdminTestimonials(password: string, enabled = true) {
  return useQuery(
    orpc.admin.testimonials.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useAddTestimonial() {
  return useMutation(orpc.admin.addTestimonial.mutationOptions());
}

export function useUpdateTestimonial() {
  return useMutation(orpc.admin.updateTestimonial.mutationOptions());
}

export function useRemoveTestimonial() {
  return useMutation(orpc.admin.removeTestimonial.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Tabela de preços (varejo + atacado)
 * ---------------------------------------------------------------- */

export function useAdminPriceModels(password: string, enabled = true) {
  return useQuery(
    orpc.admin.priceModels.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useSavePriceModel() {
  return useMutation(orpc.admin.savePriceModel.mutationOptions());
}

export function useResetPriceModel() {
  return useMutation(orpc.admin.resetPriceModel.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Faixa sazonal
 * ---------------------------------------------------------------- */

export function useAdminBanners(password: string, enabled = true) {
  return useQuery(
    orpc.admin.banners.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useSaveBanner() {
  return useMutation(orpc.admin.saveBanner.mutationOptions());
}

export function useRemoveBanner() {
  return useMutation(orpc.admin.removeBanner.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Upload de foto (URL pré-assinada)
 * ---------------------------------------------------------------- */

export function usePresignUpload() {
  return useMutation(orpc.upload.presign.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Modelos prontos (/prontos)
 * ---------------------------------------------------------------- */

export function useAdminReadyDesigns(password: string, enabled = true) {
  return useQuery(
    orpc.admin.readyDesigns.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useCreateReadyDesign() {
  return useMutation(orpc.admin.createReadyDesign.mutationOptions());
}

export function useUpdateReadyDesign() {
  return useMutation(orpc.admin.updateReadyDesign.mutationOptions());
}

export function useRemoveReadyDesign() {
  return useMutation(orpc.admin.removeReadyDesign.mutationOptions());
}

export function useReorderReadyDesigns() {
  return useMutation(orpc.admin.reorderReadyDesigns.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Tipos de caneca (/modelos)
 * ---------------------------------------------------------------- */

export function useAdminMugTypes(password: string, enabled = true) {
  return useQuery(
    orpc.admin.mugTypes.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useCreateMugType() {
  return useMutation(orpc.admin.createMugType.mutationOptions());
}

export function useUpdateMugType() {
  return useMutation(orpc.admin.updateMugType.mutationOptions());
}

export function useRemoveMugType() {
  return useMutation(orpc.admin.removeMugType.mutationOptions());
}

export function useReorderMugTypes() {
  return useMutation(orpc.admin.reorderMugTypes.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Topo da home (hero)
 * ---------------------------------------------------------------- */

export function useAdminHero(password: string, enabled = true) {
  return useQuery(
    orpc.admin.hero.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useUpdateHero() {
  return useMutation(orpc.admin.updateHero.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Popup de novidades
 * ---------------------------------------------------------------- */

export function useAdminPopup(password: string, enabled = true) {
  return useQuery(
    orpc.admin.popup.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useUpdatePopup() {
  return useMutation(orpc.admin.updatePopup.mutationOptions());
}

/* ---------------------------------------------------------------- *
 * Nota do Google
 * ---------------------------------------------------------------- */

export function useAdminAvaliacoes(password: string, enabled = true) {
  return useQuery(
    orpc.admin.avaliacoes.queryOptions({
      input: { password },
      enabled: Boolean(password) && enabled,
      staleTime: 10_000,
    }),
  );
}

export function useUpdateAvaliacoes() {
  return useMutation(orpc.admin.updateAvaliacoes.mutationOptions());
}
