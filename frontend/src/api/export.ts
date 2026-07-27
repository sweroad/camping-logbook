import { apiFetchBlob } from "./client";
import type { StatsRange } from "../types/stats";

export async function downloadExport(range: StatsRange): Promise<void> {
  const params = new URLSearchParams();
  if (range.start_date) params.set("start_date", range.start_date);
  if (range.end_date) params.set("end_date", range.end_date);
  const query = params.toString();

  const { blob, filename } = await apiFetchBlob(`/export/xlsx${query ? `?${query}` : ""}`);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? "camping-logbook-export.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
