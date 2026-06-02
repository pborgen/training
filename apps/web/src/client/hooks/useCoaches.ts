import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCoaches, fetchCoach, fetchMySpotlight, saveMySpotlight } from "../api";
import type { CoachSpotlight } from "../types";

export function useCoaches() {
  return useQuery({ queryKey: ["coaches"], queryFn: fetchCoaches });
}

export function useCoach(email: string) {
  return useQuery({
    queryKey: ["coach", email],
    queryFn: () => fetchCoach(email),
    enabled: !!email,
  });
}

export function useMySpotlight() {
  return useQuery({ queryKey: ["my-spotlight"], queryFn: fetchMySpotlight });
}

export function useSaveMySpotlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CoachSpotlight>) => saveMySpotlight(data),
    onSuccess: (data) => {
      qc.setQueryData(["my-spotlight"], data.spotlight);
      qc.invalidateQueries({ queryKey: ["coaches"] });
      qc.invalidateQueries({ queryKey: ["coach", data.spotlight.email] });
    },
  });
}
