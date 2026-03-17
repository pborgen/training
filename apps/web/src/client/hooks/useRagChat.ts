import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchRagStatus, sendRagMessage, type RagChatResponse } from "../api";

export function useRagStatus() {
  return useQuery({ queryKey: ["ragStatus"], queryFn: fetchRagStatus });
}

export function useRagChat() {
  return useMutation({
    mutationFn: ({ message, sessionId }: { message: string; sessionId?: string }) =>
      sendRagMessage(message, sessionId),
  });
}
