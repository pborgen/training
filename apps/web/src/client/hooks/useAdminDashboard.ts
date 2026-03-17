import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard } from "../api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 30_000,
  });
}
