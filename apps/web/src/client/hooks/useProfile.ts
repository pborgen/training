import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, saveProfile, uploadProfilePhoto } from "../api";
import type { UserProfile } from "../types";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
}

export function useUnits() {
  const { data } = useProfile();
  return data?.units || "lbs";
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UserProfile) => saveProfile(p),
    onSuccess: (data) => {
      qc.setQueryData(["profile"], data.profile);
    },
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoUrl: string) => uploadProfilePhoto(photoUrl),
    onSuccess: (data) => {
      qc.setQueryData(["profile"], (old: UserProfile | undefined) =>
        old ? { ...old, photoUrl: data.photoUrl } : old
      );
    },
  });
}
