import { useEffect, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
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

  return (
    <div className="location-picker">
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
