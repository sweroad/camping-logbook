import { apiFetch } from "./client";
import type { Photo } from "../types/trip";

export function uploadPhoto(tripId: string, file: File): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<Photo>(`/trips/${tripId}/photos`, { method: "POST", body: formData });
}

export function deletePhoto(photoId: string): Promise<void> {
  return apiFetch<void>(`/photos/${photoId}`, { method: "DELETE" });
}
