import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useTrips } from "../hooks/useTrips";

const DEFAULT_CENTER = { lat: 59.3293, lng: 18.0686 };

export default function MapPage() {
  const { data, isLoading, isError } = useTrips({ limit: 200 });

  if (isLoading) return <p>Loading...</p>;
  if (isError) {
    return (
      <p className="form-error" role="alert">
        Could not load trips.
      </p>
    );
  }

  const pins = (data?.items ?? []).flatMap((trip) =>
    trip.latitude !== null && trip.longitude !== null
      ? [{ ...trip, latitude: trip.latitude, longitude: trip.longitude }]
      : [],
  );

  const center = pins.length > 0 ? { lat: pins[0].latitude, lng: pins[0].longitude } : DEFAULT_CENTER;

  return (
    <div className="map-page">
      <h1>Map</h1>
      {pins.length === 0 && <p>No trips with a location pinned yet.</p>}
      <MapContainer center={center} zoom={pins.length > 0 ? 6 : 4} className="trips-map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {pins.map((trip) => (
          <Marker key={trip.id} position={{ lat: trip.latitude, lng: trip.longitude }}>
            <Popup>
              <Link to={`/trips/${trip.id}`}>{trip.location_name}</Link>
              <br />
              {trip.start_date} → {trip.end_date}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
