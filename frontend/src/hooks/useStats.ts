import { useQuery } from "@tanstack/react-query";
import { getStatsByMonth, getStatsSummary } from "../api/stats";
import type { StatsRange } from "../types/stats";

export function useStatsSummary(range: StatsRange) {
  return useQuery({
    queryKey: ["stats", "summary", range],
    queryFn: () => getStatsSummary(range),
  });
}

export function useStatsByMonth(range: StatsRange) {
  return useQuery({
    queryKey: ["stats", "by_month", range],
    queryFn: () => getStatsByMonth(range),
  });
}
