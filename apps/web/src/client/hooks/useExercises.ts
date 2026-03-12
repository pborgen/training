import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExercises, fetchUserExercises, createUserExercise, deleteUserExercise } from "../api";
import type { UserExercise } from "../types";

export function useCatalogExercises() {
  return useQuery({ queryKey: ["exercises"], queryFn: fetchExercises });
}

export function useUserExercises() {
  return useQuery({ queryKey: ["userExercises"], queryFn: fetchUserExercises });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ex: Partial<UserExercise>) => createUserExercise(ex),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userExercises"] }); },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUserExercise(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userExercises"] }); },
  });
}
