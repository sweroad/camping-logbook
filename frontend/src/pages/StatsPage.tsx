import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExportButton from "../components/stats/ExportButton";
import MonthlyNightsChart from "../components/stats/MonthlyNightsChart";
import StayTypeChart from "../components/stats/StayTypeChart";
import { useStatsByMonth, useStatsSummary } from "../hooks/useStats";
import { useTrips } from "../hooks/useTrips";
import { STAY_TYPES } from "../utils/stayType";

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const ALL_TIME_RANGE = { start_date: "1900-01-01", end_date: "2100-01-01" };

export default function StatsPage() {
  const initialYear = useMemo(() => String(new Date().getFullYear()), []);
  const [year, setYear] = useState(initialYear);

  const { data: allTripsData } = useTrips({ limit: 200 });
  const years = useMemo(
    () =>
      Array.from(new Set((allTripsData?.items ?? []).map((t) => t.start_date.slice(0, 4))))
        .sort()
        .reverse(),
    [allTripsData],
  );

  const range =
    year === "all" ? ALL_TIME_RANGE : { start_date: `${year}-01-01`, end_date: addDays(`${year}-12-31`, 1) };

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useStatsSummary(range);
  const { data: byMonth } = useStatsByMonth(range, year !== "all");
  const { data: rangedTrips } = useTrips({ ...range, limit: 200 });

  const trips = rangedTrips?.items ?? [];
  const placeCount = new Set(trips.map((t) => t.location_name)).size;
  const pricedTrips = trips.filter((t) => t.price_total !== null);
  const pricedNights = pricedTrips.reduce((sum, t) => sum + t.nights, 0);
  const ratedTrips = trips.filter((t) => t.star_rating !== null);
  const topRated = [...ratedTrips].sort((a, b) => (b.star_rating ?? 0) - (a.star_rating ?? 0)).slice(0, 3);

  const stayTypeData = useMemo(() => {
    const nightsByType = new Map<string, number>();
    let unspecifiedNights = 0;
    for (const trip of trips) {
      if (trip.stay_type) {
        nightsByType.set(trip.stay_type, (nightsByType.get(trip.stay_type) ?? 0) + trip.nights);
      } else {
        unspecifiedNights += trip.nights;
      }
    }
    return [
      ...STAY_TYPES.map((type) => ({ label: type.label, nights: nightsByType.get(type.value) ?? 0 })),
      { label: "Not specified", nights: unspecifiedNights },
    ];
  }, [trips]);

  const periodLabel = year === "all" ? "all-time" : `in ${year}`;

  return (
    <div className="stats-page">
      <h1>Stats</h1>

      <div className="year-chips">
        <button type="button" className={year === "all" ? "year-chip active" : "year-chip"} onClick={() => setYear("all")}>
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

      {summaryError && (
        <p className="form-error" role="alert">
          Could not load stats.
        </p>
      )}

      {summary && !summaryLoading && (
        <>
          <div className="stats-hero">
            <span className="stats-hero-label">Nights in the caravan</span>
            <div className="stats-hero-value-row">
              <span className="stats-hero-value">{summary.total_nights}</span>
              <span className="stats-hero-period">{periodLabel}</span>
            </div>
          </div>

          <div className="stat-tiles">
            <div className="stat-tile">
              <span className="stat-tile-label">Cost</span>
              <span className="stat-tile-value">{summary.total_price !== null ? `${summary.total_price} SEK` : "—"}</span>
              <span className="stat-tile-sub">
                {pricedTrips.length} of {trips.length} with price
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Avg / night</span>
              <span className="stat-tile-value">
                {summary.avg_price_per_night !== null ? `${summary.avg_price_per_night} SEK` : "—"}
              </span>
              <span className="stat-tile-sub">{pricedNights} priced nights</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Places</span>
              <span className="stat-tile-value">{placeCount}</span>
              <span className="stat-tile-sub">{trips.length} stays</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Avg rating</span>
              <span className="stat-tile-value">
                {summary.avg_star_rating !== null ? summary.avg_star_rating.toFixed(1) : "—"}
              </span>
              <span className="stat-tile-sub">{ratedTrips.length} rated</span>
            </div>
          </div>
        </>
      )}

      {year !== "all" && byMonth && byMonth.months.length > 0 && (
        <div className="stats-chart-card">
          <span className="stats-chart-card-label">Nights per month</span>
          <MonthlyNightsChart months={byMonth.months} />
        </div>
      )}

      {trips.length > 0 && (
        <div className="stats-chart-card">
          <span className="stats-chart-card-label">Nights by type</span>
          <StayTypeChart data={stayTypeData} />
        </div>
      )}

      {topRated.length > 0 && (
        <div className="top-rated">
          <span className="top-rated-label">Top rated</span>
          {topRated.map((trip) => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="top-rated-row">
              <span className="top-rated-name">{trip.location_name}</span>
              <span className="top-rated-stars">{"★".repeat(trip.star_rating ?? 0)}</span>
            </Link>
          ))}
        </div>
      )}

      <h2>Export</h2>
      <div className="export-actions">
        <ExportButton range={range}>Export selected range (.xlsx)</ExportButton>
        <ExportButton range={{}}>Export full backup, all trips (.xlsx)</ExportButton>
      </div>
    </div>
  );
}
