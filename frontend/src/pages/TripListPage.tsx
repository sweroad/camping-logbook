import { useState } from "react";
import { Link } from "react-router-dom";
import { useTrips } from "../hooks/useTrips";
import type { Trip } from "../types/trip";

function formatPrice(trip: Pick<Trip, "price_total" | "currency">): string {
  if (trip.price_total === null) return "—";
  return `${trip.price_total} ${trip.currency}`;
}

export default function TripListPage() {
  const [q, setQ] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isError } = useTrips({
    q: q || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  return (
    <div className="trip-list-page">
      <h1>Trips</h1>

      <div className="trip-filters">
        <input
          type="search"
          placeholder="Search location, area, notes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          aria-label="From date"
        />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="To date" />
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && (
        <p className="form-error" role="alert">
          Could not load trips.
        </p>
      )}
      {data && data.items.length === 0 && <p>No trips logged yet.</p>}

      <ul className="trip-list">
        {data?.items.map((trip) => (
          <li key={trip.id}>
            <Link to={`/trips/${trip.id}`} className="trip-list-item">
              <strong>
                {trip.location_name}
                {trip.place_area ? `, ${trip.place_area}` : ""}
              </strong>
              <div>
                {trip.start_date} → {trip.end_date} ({trip.nights} {trip.nights === 1 ? "night" : "nights"})
              </div>
              <div>
                {formatPrice(trip)}
                {trip.star_rating ? ` · ${"★".repeat(trip.star_rating)}` : ""}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
