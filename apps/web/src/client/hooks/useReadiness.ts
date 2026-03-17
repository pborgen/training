import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReadiness, saveReadiness, updateReadiness, deleteReadiness } from "../api";
import type { ReadinessCheckin } from "../types";

export function useReadiness(limit = 0) {
  return useQuery({ queryKey: ["readiness", limit], queryFn: () => fetchReadiness(limit) });
}

export function useSaveReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Omit<ReadinessCheckin, "id" | "createdAt">) => saveReadiness(c),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["readiness"] }); },
  });
}

export function useUpdateReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ReadinessCheckin) => updateReadiness(id, data as Omit<ReadinessCheckin, "id" | "createdAt">),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["readiness"] }); },
  });
}

export function useDeleteReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReadiness(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["readiness"] }); },
  });
}
