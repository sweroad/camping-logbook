import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTrip, deleteTrip, getTrip, listTrips, updateTrip } from "../api/trips";
import type { TripFilters, TripPayload } from "../types/trip";

export function useTrips(filters: TripFilters) {
  return useQuery({
    queryKey: ["trips", filters],
    queryFn: () => listTrips(filters),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trips", id],
    queryFn: () => getTrip(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TripPayload) => createTrip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TripPayload>) => updateTrip(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
