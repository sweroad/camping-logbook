interface StayTypeChartProps {
  data: { label: string; nights: number }[];
}

export default function StayTypeChart({ data }: StayTypeChartProps) {
  const max = Math.max(1, ...data.map((d) => d.nights));

  return (
    <div className="staytype-chart">
      {data.map((d) => (
        <div className="staytype-row" key={d.label}>
          <span className="staytype-row-label">{d.label}</span>
          <div className="staytype-row-track">
            <div className="staytype-row-bar" style={{ width: `${(d.nights / max) * 100}%` }} />
          </div>
          <span className="staytype-row-value">{d.nights}</span>
        </div>
      ))}
    </div>
  );
}
