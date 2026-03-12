import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoutines, fetchRoutine, createRoutine, updateRoutine, deleteRoutine } from "../api";
import type { Routine } from "../types";

export function useRoutines() {
  return useQuery({ queryKey: ["routines"], queryFn: fetchRoutines });
}

export function useRoutine(id: string) {
  return useQuery({ queryKey: ["routines", id], queryFn: () => fetchRoutine(id), enabled: !!id });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: Partial<Routine>) => createRoutine(r),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routines"] }); },
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...r }: Partial<Routine> & { id: string }) => updateRoutine(id, r),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routines"] }); },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routines"] }); },
  });
}
