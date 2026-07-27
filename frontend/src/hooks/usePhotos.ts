import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePhoto, uploadPhoto } from "../api/photos";

export function useUploadPhoto(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadPhoto(tripId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
    },
  });
}

export function useDeletePhoto(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips", tripId] });
    },
  });
}
