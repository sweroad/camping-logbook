import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker } from "react-leaflet";
import VlTileLayer from "../components/map/VlTileLayer";
import { createPinIcon } from "../components/map/pinIcon";
import { useTrips } from "../hooks/useTrips";

const DEFAULT_CENTER = { lat: 59.3293, lng: 18.0686 };

export default function MapPage() {
  const { data, isLoading, isError } = useTrips({ limit: 200 });

  const pins = useMemo(
    () =>
      (data?.items ?? []).flatMap((trip) =>
        trip.latitude !== null && trip.longitude !== null
          ? [{ ...trip, latitude: trip.latitude, longitude: trip.longitude }]
          : [],
      ),
    [data],
  );

  if (isLoading) return <p>Loading...</p>;
  if (isError) {
    return (
      <p className="form-error" role="alert">
        Could not load trips.
      </p>
    );
  }

  const center = pins.length > 0 ? { lat: pins[0].latitude, lng: pins[0].longitude } : DEFAULT_CENTER;

  return (
    <div className="map-page">
      <MapContainer center={center} zoom={pins.length > 0 ? 6 : 4} zoomControl={false} className="trips-map">
        <VlTileLayer />
        {pins.map((trip, index) => (
          <Marker
            key={trip.id}
            position={{ lat: trip.latitude, lng: trip.longitude }}
            icon={createPinIcon(String(index + 1))}
          />
        ))}
      </MapContainer>

      <div className="map-page-fade" />
      <h1>Map</h1>

      {pins.length === 0 ? (
        <p className="map-empty-note">No trips with a location pinned yet.</p>
      ) : (
        <div className="map-rail">
          {pins.map((trip, index) => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="map-card">
              <span className="map-card-name">
                {index + 1}. {trip.location_name}
              </span>
              <span className="map-card-meta">
                {trip.start_date} · {trip.nights} {trip.nights === 1 ? "night" : "nights"} ·{" "}
                {trip.price_total !== null ? `${trip.price_total} ${trip.currency}` : "price missing"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
