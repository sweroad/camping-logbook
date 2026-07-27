export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    country_code?: string;
  };
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ format: "json", q: query, limit: "5", addressdetails: "1" });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) {
    throw new Error("Search failed");
  }
  return response.json();
}
