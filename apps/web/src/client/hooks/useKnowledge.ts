import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchKnowledgeChunks, createKnowledgeChunk, updateKnowledgeChunk, deleteKnowledgeChunk } from "../api";

export function useKnowledge() {
  return useQuery({ queryKey: ["knowledge"], queryFn: fetchKnowledgeChunks });
}

export function useCreateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgeChunk,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge"] }); },
  });
}

export function useUpdateKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, content }: { id: string; title: string; content: string }) => updateKnowledgeChunk(id, { title, content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge"] }); },
  });
}

export function useDeleteKnowledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteKnowledgeChunk,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge"] }); },
  });
}
