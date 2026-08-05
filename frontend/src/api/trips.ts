import { apiFetch } from "./client";
import type { Trip, TripFilters, TripListResponse, TripPayload } from "../types/trip";

export function listTrips(filters: TripFilters = {}): Promise<TripListResponse> {
  const params = new URLSearchParams();
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.q) params.set("q", filters.q);
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return apiFetch<TripListResponse>(`/trips${query ? `?${query}` : ""}`);
}

export function getTrip(id: string): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${id}`);
}

export function createTrip(payload: TripPayload): Promise<Trip> {
  return apiFetch<Trip>("/trips", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTrip(id: string, payload: Partial<TripPayload>): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteTrip(id: string): Promise<void> {
  return apiFetch<void>(`/trips/${id}`, { method: "DELETE" });
}

export function uploadRoute(tripId: string, file: File): Promise<Trip> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<Trip>(`/trips/${tripId}/route`, { method: "POST", body: formData });
}

export function deleteRoute(tripId: string): Promise<Trip> {
  return apiFetch<Trip>(`/trips/${tripId}/route`, { method: "DELETE" });
}
