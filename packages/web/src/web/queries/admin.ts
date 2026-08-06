import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Hooks do painel interno — todas as chamadas mandam a senha para o servidor. */

export function useAdminLogin() {
  return useMutation(orpc.admin.login.mutationOptions());
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

export function useAdminOrders(password: string) {
  return useQuery(
    orpc.admin.orders.queryOptions({
      input: { password },
      enabled: Boolean(password),
      staleTime: 15_000,
    }),
  );
}

export function useSetQuoteStatus() {
  return useMutation(orpc.admin.setQuoteStatus.mutationOptions());
}

export function useSetOrderStatus() {
  return useMutation(orpc.admin.setOrderStatus.mutationOptions());
}
