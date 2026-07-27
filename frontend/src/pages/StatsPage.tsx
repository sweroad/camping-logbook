import { useMemo, useState } from "react";
import ExportButton from "../components/stats/ExportButton";
import MonthlyNightsChart from "../components/stats/MonthlyNightsChart";
import { useStatsByMonth, useStatsSummary } from "../hooks/useStats";

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, endInclusive: `${year}-12-31` };
}

export default function StatsPage() {
  const initial = useMemo(defaultRange, []);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDateInclusive, setEndDateInclusive] = useState(initial.endInclusive);

  const range = { start_date: startDate, end_date: addDays(endDateInclusive, 1) };
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useStatsSummary(range);
  const { data: byMonth, isLoading: monthsLoading } = useStatsByMonth(range);

  return (
    <div className="stats-page">
      <h1>Stats</h1>

      <div className="trip-filters">
        <label>
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={endDateInclusive} onChange={(e) => setEndDateInclusive(e.target.value)} />
        </label>
      </div>

      {summaryError && (
        <p className="form-error" role="alert">
          Could not load stats.
        </p>
      )}
      {summaryLoading && <p>Loading...</p>}

      {summary && (
        <div className="stat-tiles">
          <div className="stat-tile">
            <span className="stat-tile-label">Trips</span>
            <span className="stat-tile-value">{summary.trip_count}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-label">Nights</span>
            <span className="stat-tile-value">{summary.total_nights}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-label">Total spend</span>
            <span className="stat-tile-value">
              {summary.total_price !== null ? `${summary.total_price} SEK` : "—"}
            </span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-label">Avg / night</span>
            <span className="stat-tile-value">
              {summary.avg_price_per_night !== null ? `${summary.avg_price_per_night} SEK` : "—"}
            </span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile-label">Avg rating</span>
            <span className="stat-tile-value">
              {summary.avg_star_rating !== null ? summary.avg_star_rating.toFixed(1) : "—"}
            </span>
          </div>
        </div>
      )}

      {!monthsLoading && byMonth && byMonth.months.length > 0 && (
        <>
          <h2>Nights per month</h2>
          <MonthlyNightsChart months={byMonth.months} />
        </>
      )}

      <h2>Export</h2>
      <div className="export-actions">
        <ExportButton range={range}>Export selected range (.xlsx)</ExportButton>
        <ExportButton range={{}}>Export full backup, all trips (.xlsx)</ExportButton>
      </div>
    </div>
  );
}
