import { MapContainer, Marker } from "react-leaflet";
import VlTileLayer from "./VlTileLayer";
import { createPinIcon } from "./pinIcon";

interface TripHeroMapProps {
  latitude: number | null;
  longitude: number | null;
}

export default function TripHeroMap({ latitude, longitude }: TripHeroMapProps) {
  if (latitude === null || longitude === null) {
    return (
      <div className="trip-hero-map trip-hero-map--empty">
        <p>No location saved — add one via Edit.</p>
      </div>
    );
  }

  return (
    <div className="trip-hero-map">
      <MapContainer
        center={{ lat: latitude, lng: longitude }}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        className="trip-hero-map-container"
      >
        <VlTileLayer />
        <Marker position={{ lat: latitude, lng: longitude }} icon={createPinIcon()} />
      </MapContainer>
    </div>
  );
}
