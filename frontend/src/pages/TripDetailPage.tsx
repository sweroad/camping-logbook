import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TripHeroMap from "../components/map/TripHeroMap";
import PhotoGallery from "../components/photo/PhotoGallery";
import PhotoLightbox from "../components/photo/PhotoLightbox";
import PhotoUploader from "../components/photo/PhotoUploader";
import RouteUploader from "../components/route/RouteUploader";
import { useTrip } from "../hooks/useTrips";
import type { Trip } from "../types/trip";
import { formatStayType } from "../utils/stayType";

function formatPriceValue(trip: Pick<Trip, "price_total" | "currency" | "stay_type">): string {
  if (trip.price_total === null) return trip.stay_type === "fricamping" ? "Free" : "Missing";
  if (trip.price_total === 0) return "Free";
  return `${trip.price_total} ${trip.currency}`;
}

function formatPriceLabel(trip: Pick<Trip, "price_input_mode" | "price_per_night_input">): string {
  if (trip.price_input_mode === "per_night" && trip.price_per_night_input !== null) {
    return `Price (${trip.price_per_night_input}/night)`;
  }
  return "Price";
}

function formatAreaLine(trip: Pick<Trip, "place_area" | "plot_number" | "country">): string {
  const parts = [trip.place_area, trip.plot_number ? `Plot ${trip.plot_number}` : null, trip.country].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : "No area given";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading, isError } = useTrip(id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading) return <p>Loading...</p>;
  if (isError || !trip) {
    return (
      <p className="form-error" role="alert">
        Trip not found.
      </p>
    );
  }

  const facts = [
    { label: "Date", value: `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}` },
    { label: "Nights", value: String(trip.nights) },
    { label: formatPriceLabel(trip), value: formatPriceValue(trip) },
    {
      label: "Position",
      value:
        trip.latitude !== null && trip.longitude !== null
          ? `${trip.latitude.toFixed(4)}, ${trip.longitude.toFixed(4)}`
          : "Missing",
    },
  ];

  return (
    <div className="trip-detail-page">
      <div className="trip-hero">
        <TripHeroMap latitude={trip.latitude} longitude={trip.longitude} routeSegments={trip.route_points} />
        <button type="button" className="trip-hero-back" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <Link to={`/trips/${trip.id}/edit`} className="trip-hero-edit">
          Edit
        </Link>
      </div>

      <div className="trip-detail-body">
        <h1>{trip.location_name}</h1>
        <p className="trip-detail-area">{formatAreaLine(trip)}</p>
        <div className="trip-detail-meta">
          {trip.star_rating && <span className="trip-detail-stars">{"★".repeat(trip.star_rating)}</span>}
          {trip.stay_type && <span className="badge badge--staytype">{formatStayType(trip.stay_type)}</span>}
        </div>

        <div className="trip-fact-grid">
          {facts.map((fact) => (
            <div className="trip-fact" key={fact.label}>
              <span className="trip-fact-label">{fact.label}</span>
              <span className="trip-fact-value">{fact.value}</span>
            </div>
          ))}
        </div>

        {trip.notes && (
          <div className="trip-note">
            <span className="trip-note-label">Note</span>
            <p className="trip-note-text">{trip.notes}</p>
          </div>
        )}

        <div className="trip-route-section">
          <div className="trip-route-head">
            <span className="trip-route-label">Route</span>
            <RouteUploader
              tripId={trip.id}
              hasRoute={Boolean(trip.route_points && trip.route_points.length > 0)}
            />
          </div>
          {(!trip.route_points || trip.route_points.length === 0) && (
            <p className="trip-route-empty">No driven route attached yet.</p>
          )}
          <details className="route-help">
            <summary>How do I get a route file?</summary>
            <p>
              Upload a CSV with a timestamp column (<code>date</code>/<code>time</code>/<code>timestamp</code>) and
              coordinate columns (<code>latitude</code>/<code>lat</code>, <code>longitude</code>/<code>lng</code>/
              <code>lon</code>). Extra columns are ignored.
            </p>
            <p>Run this in Grafana against your TeslaMate datasource, then use "Inspect → Data → Download CSV":</p>
            <pre>{`SELECT date, latitude, longitude
FROM positions
WHERE car_id = $car_id
  AND date BETWEEN '${trip.start_date}' AND '${addDays(trip.end_date, 1)}'
ORDER BY date`}</pre>
          </details>
        </div>

        <div className="trip-photos-section">
          <div className="trip-photos-head">
            <span className="trip-photos-label">Photos</span>
            <PhotoUploader tripId={trip.id} />
          </div>
          <PhotoGallery tripId={trip.id} photos={trip.photos} onOpen={setLightboxIndex} />
        </div>

        <p className="trip-audit">
          Created {formatDate(trip.created_at)} · last edited {formatDate(trip.updated_at)}
        </p>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox photos={trip.photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
