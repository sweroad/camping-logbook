import type { StayType } from "../types/trip";

export const STAY_TYPE_LABELS: Record<StayType, string> = {
  camping: "Camping",
  stallplats: "Ställplats",
  fricamping: "Fricamping",
};

export const STAY_TYPES: { value: StayType; label: string }[] = (
  Object.entries(STAY_TYPE_LABELS) as [StayType, string][]
).map(([value, label]) => ({ value, label }));

export function formatStayType(stayType: StayType | null): string | null {
  return stayType ? STAY_TYPE_LABELS[stayType] : null;
}
