import { useEffect, useState, type KeyboardEvent } from "react";
import type { LatLngLiteral } from "leaflet";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { searchPlaces, type GeocodeResult } from "../../api/geocode";
import VlTileLayer from "./VlTileLayer";
import { createPinIcon } from "./pinIcon";

interface LocationPickerProps {
  value: LatLngLiteral | null;
  onChange: (value: LatLngLiteral) => void;
  onClear: () => void;
}

const DEFAULT_CENTER: LatLngLiteral = { lat: 59.3293, lng: 18.0686 };

function ClickHandler({ onChange }: { onChange: (value: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng);
    },
  });
  return null;
}

function RecenterOnChange({ value }: { value: LatLngLiteral | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) {
      map.setView(value, Math.max(map.getZoom(), 13));
    }
  }, [value, map]);
  return null;
}

export default function LocationPicker({ value, onChange, onClear }: LocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => setGeoError("Could not get your location."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const found = await searchPlaces(trimmed);
      setResults(found);
      if (found.length === 0) setSearchError("No matches found.");
    } catch {
      setSearchError("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // This input lives inside the trip form — prevent Enter from submitting it.
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  }

  function handleSelectResult(result: GeocodeResult) {
    onChange({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setQuery(result.display_name);
    setResults([]);
  }

  return (
    <div className="location-picker">
      <div className="location-search">
        <input
          type="search"
          placeholder="Search for a place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        <button type="button" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
      {searchError && (
        <span className="form-error" role="alert">
          {searchError}
        </span>
      )}
      {results.length > 0 && (
        <ul className="location-search-results">
          {results.map((result, index) => (
            <li key={`${result.lat},${result.lon},${index}`}>
              <button type="button" onClick={() => handleSelectResult(result)}>
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="location-picker-controls">
        <button type="button" onClick={useMyLocation}>
          Use my location
        </button>
        {value && (
          <button type="button" onClick={onClear}>
            Clear location
          </button>
        )}
        {value && (
          <span className="location-picker-coords">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </span>
        )}
      </div>
      {geoError && (
        <span className="form-error" role="alert">
          {geoError}
        </span>
      )}
      <MapContainer center={value ?? DEFAULT_CENTER} zoom={value ? 13 : 5} className="location-picker-map">
        <VlTileLayer />
        <ClickHandler onChange={onChange} />
        <RecenterOnChange value={value} />
        {value && (
          <Marker
            position={value}
            icon={createPinIcon()}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const position = e.target.getLatLng();
                onChange({ lat: position.lat, lng: position.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
