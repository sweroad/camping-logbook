import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTrips } from "../hooks/useTrips";
import type { Trip } from "../types/trip";
import { formatStayType } from "../utils/stayType";

function formatPriceLabel(trip: Pick<Trip, "price_total" | "currency">): string {
  if (trip.price_total === null) return "Price missing";
  if (trip.price_total === 0) return "Free";
  return `${trip.price_total} ${trip.currency}`;
}

function formatAreaLine(trip: Pick<Trip, "place_area" | "plot_number">): string {
  const parts = [trip.place_area, trip.plot_number ? `Plot ${trip.plot_number}` : null].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : "No area given";
}

function dateBadge(dateStr: string): { day: string; month: string } {
  const date = new Date(`${dateStr}T00:00:00`);
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
  };
}

function nightsLabel(nights: number): string {
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

export default function TripListPage() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");

  const { data, isLoading, isError } = useTrips({ limit: 200 });
  const trips = useMemo(() => data?.items ?? [], [data]);

  const years = useMemo(
    () =>
      Array.from(new Set(trips.map((t) => t.start_date.slice(0, 4))))
        .sort()
        .reverse(),
    [trips],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trips
      .filter((t) => year === "all" || t.start_date.slice(0, 4) === year)
      .filter(
        (t) =>
          !q ||
          t.location_name.toLowerCase().includes(q) ||
          (t.place_area ?? "").toLowerCase().includes(q) ||
          (t.country ?? "").toLowerCase().includes(q) ||
          (formatStayType(t.stay_type) ?? "").toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
  }, [trips, query, year]);

  const groups = useMemo(() => {
    const byYear = new Map<string, Trip[]>();
    for (const trip of filtered) {
      const groupYear = trip.start_date.slice(0, 4);
      const existing = byYear.get(groupYear);
      if (existing) {
        existing.push(trip);
      } else {
        byYear.set(groupYear, [trip]);
      }
    }
    return Array.from(byYear.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([groupYear, items]) => ({
        year: groupYear,
        items,
        totalNights: items.reduce((sum, t) => sum + t.nights, 0),
      }));
  }, [filtered]);

  const totalNights = filtered.reduce((sum, t) => sum + t.nights, 0);

  return (
    <div className="trip-list-page">
      <h1>Trips</h1>
      <p className="trip-list-subtitle">
        {filtered.length} {filtered.length === 1 ? "trip" : "trips"} · {nightsLabel(totalNights)}
        {year === "all" ? " across all years" : ` in ${year}`}
      </p>

      <div className="trip-filters">
        <input
          type="search"
          placeholder="Search location, area, notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="year-chips">
        <button
          type="button"
          className={year === "all" ? "year-chip active" : "year-chip"}
          onClick={() => setYear("all")}
        >
          All years
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            className={year === y ? "year-chip active" : "year-chip"}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && (
        <p className="form-error" role="alert">
          Could not load trips.
        </p>
      )}
      {!isLoading && filtered.length === 0 && <p>No trips logged yet.</p>}

      <div className="trip-groups">
        {groups.map((group) => (
          <div className="trip-group" key={group.year}>
            <div className="trip-group-head">
              <span className="trip-group-year">{group.year}</span>
              <span className="trip-group-line" />
              <span className="trip-group-summary">{nightsLabel(group.totalNights)}</span>
            </div>

            <ul className="trip-list">
              {group.items.map((trip) => {
                const badge = dateBadge(trip.start_date);
                return (
                  <li key={trip.id}>
                    <Link to={`/trips/${trip.id}`} className="trip-list-item">
                      <div className="trip-date-badge">
                        <span className="trip-date-day">{badge.day}</span>
                        <span className="trip-date-month">{badge.month}</span>
                      </div>
                      <div className="trip-list-item-body">
                        <strong>{trip.location_name}</strong>
                        <div className="trip-list-item-area">{formatAreaLine(trip)}</div>
                        <div className="trip-badges">
                          <span className="badge badge--nights">{nightsLabel(trip.nights)}</span>
                          <span className="badge badge--price">{formatPriceLabel(trip)}</span>
                          {trip.stay_type && (
                            <span className="badge badge--staytype">{formatStayType(trip.stay_type)}</span>
                          )}
                          {trip.star_rating && (
                            <span className="badge badge--stars">{"★".repeat(trip.star_rating)}</span>
                          )}
                          {trip.latitude === null && <span className="badge badge--missing">No pin</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
