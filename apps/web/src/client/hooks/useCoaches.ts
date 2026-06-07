import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCoaches, fetchCoach, fetchMySpotlight, saveMySpotlight,
  requestCoach, fetchMyRequests, fetchCoachRequests, updateCoachRequest,
} from "../api";
import type { CoachSpotlight, CoachingRequestStatus } from "../types";

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

export function useMyRequests() {
  return useQuery({ queryKey: ["my-requests"], queryFn: fetchMyRequests });
}

export function useRequestCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, planId, planName, message }: { email: string; planId?: string; planName?: string; message?: string }) =>
      requestCoach(email, { planId, planName, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    },
  });
}

export function useCoachRequests() {
  return useQuery({ queryKey: ["coach-requests"], queryFn: fetchCoachRequests });
}

export function useUpdateCoachRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CoachingRequestStatus }) => updateCoachRequest(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-requests"] });
    },
  });
}
