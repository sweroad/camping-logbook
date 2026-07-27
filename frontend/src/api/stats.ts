import { apiFetch } from "./client";
import type { StatsByMonthResponse, StatsRange, StatsSummary } from "../types/stats";

function toQuery(range: StatsRange): string {
  const params = new URLSearchParams();
  if (range.start_date) params.set("start_date", range.start_date);
  if (range.end_date) params.set("end_date", range.end_date);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getStatsSummary(range: StatsRange): Promise<StatsSummary> {
  return apiFetch<StatsSummary>(`/stats/summary${toQuery(range)}`);
}

export function getStatsByMonth(range: StatsRange): Promise<StatsByMonthResponse> {
  return apiFetch<StatsByMonthResponse>(`/stats/by_month${toQuery(range)}`);
}
