import { useEffect } from "react";
import { MapContainer, Marker, Polyline, useMap } from "react-leaflet";
import type { RouteSegment } from "../../types/trip";
import VlTileLayer from "./VlTileLayer";
import { createPinIcon } from "./pinIcon";

interface TripHeroMapProps {
  latitude: number | null;
  longitude: number | null;
  routeSegments?: RouteSegment[] | null;
}

function FitRouteBounds({ routeSegments }: { routeSegments: RouteSegment[] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = routeSegments.flat();
    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [20, 20] });
    }
  }, [routeSegments, map]);
  return null;
}

export default function TripHeroMap({ latitude, longitude, routeSegments }: TripHeroMapProps) {
  if (latitude === null || longitude === null) {
    return (
      <div className="trip-hero-map trip-hero-map--empty">
        <p>No location saved — add one via Edit.</p>
      </div>
    );
  }

  const hasRoute = Boolean(routeSegments && routeSegments.length > 0);

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
        {hasRoute && <Polyline positions={routeSegments!} pathOptions={{ color: "#C0522F", weight: 3 }} />}
        <Marker position={{ lat: latitude, lng: longitude }} icon={createPinIcon()} />
        {hasRoute && <FitRouteBounds routeSegments={routeSegments!} />}
      </MapContainer>
    </div>
  );
}
