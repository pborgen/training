import { useMutation } from "@tanstack/react-query";
import { sendTeamMessage } from "../api";

export function useCoachTeam() {
  return useMutation({
    mutationFn: ({ message, sessionId }: { message: string; sessionId?: string }) =>
      sendTeamMessage(message, sessionId),
  });
}
