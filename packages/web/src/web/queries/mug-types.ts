import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/** Tipos de caneca visíveis, na ordem do painel, com preço já resolvido. */
export function useTiposCaneca() {
  return useQuery(
    orpc.mugTypes.list.queryOptions({ staleTime: 5 * 60_000 }),
  );
}
