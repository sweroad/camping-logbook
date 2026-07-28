export type PriceInputMode = "total" | "per_night" | "none";
export type StayType = "camping" | "stallplats" | "fricamping";

export interface Photo {
  id: string;
  trip_id: string;
  file_path: string;
  original_filename: string | null;
  content_type: string;
  file_size_bytes: number | null;
  uploaded_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  campsite_id: string | null;
  location_name: string;
  place_area: string | null;
  plot_number: string | null;
  country: string | null;
  stay_type: StayType | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  price_total: number | null;
  price_per_night_input: number | null;
  price_input_mode: PriceInputMode;
  currency: string;
  star_rating: number | null;
  notes: string | null;
  nights: number;
  created_at: string;
  updated_at: string;
  photos: Photo[];
}

export interface TripListResponse {
  items: Trip[];
  total: number;
}

export interface TripPayload {
  location_name: string;
  place_area?: string | null;
  plot_number?: string | null;
  country?: string | null;
  stay_type?: StayType | null;
  latitude?: number | null;
  longitude?: number | null;
  start_date: string;
  end_date: string;
  price_total?: number | null;
  price_per_night_input?: number | null;
  price_input_mode: PriceInputMode;
  currency: string;
  star_rating?: number | null;
  notes?: string | null;
  campsite_id?: string | null;
}

export interface TripFilters {
  start_date?: string;
  end_date?: string;
  q?: string;
  limit?: number;
}
