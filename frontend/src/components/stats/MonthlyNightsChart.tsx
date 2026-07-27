import type { MonthlyStat } from "../../types/stats";

interface MonthlyNightsChartProps {
  months: MonthlyStat[];
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
}

export default function MonthlyNightsChart({ months }: MonthlyNightsChartProps) {
  const maxNights = Math.max(1, ...months.map((m) => m.total_nights));

  return (
    <div className="stats-chart">
      <div className="stats-chart-bars">
        {months.map((m) => {
          const heightPct = (m.total_nights / maxNights) * 100;
          const label = monthLabel(m.month);
          const title = `${label} ${m.month.slice(0, 4)}: ${m.total_nights} night${m.total_nights === 1 ? "" : "s"}${
            m.total_price !== null ? `, ${m.total_price} SEK` : ""
          }`;

          return (
            <div className="stats-chart-column" key={m.month}>
              <div className="stats-chart-bar-track">
                <div
                  className="stats-chart-bar"
                  style={{ height: `${heightPct}%` }}
                  title={title}
                  tabIndex={0}
                  role="img"
                  aria-label={title}
                >
                  {m.total_nights > 0 && <span className="stats-chart-value">{m.total_nights}</span>}
                </div>
              </div>
              <span className="stats-chart-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
