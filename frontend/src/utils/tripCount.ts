import type { Trip } from "../types/trip";

export function countLogicalTrips(trips: Pick<Trip, "start_date" | "end_date">[]): number {
  const sorted = [...trips].sort((a, b) => a.start_date.localeCompare(b.start_date));
  let count = 0;
  let prevEndDate: string | null = null;
  for (const trip of sorted) {
    if (trip.start_date !== prevEndDate) count += 1;
    prevEndDate = trip.end_date;
  }
  return count;
}
