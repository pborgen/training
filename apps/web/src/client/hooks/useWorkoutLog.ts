import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkoutLog, saveWorkoutLog } from "../api";
import type { WorkoutLogEntry } from "../types";

export function useWorkoutLog(limit = 0) {
  return useQuery({ queryKey: ["workoutLog", limit], queryFn: () => fetchWorkoutLog(limit) });
}

export function useSaveWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: Omit<WorkoutLogEntry, "id">) => saveWorkoutLog(entry),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workoutLog"] }); },
  });
}
