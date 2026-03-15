type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
};

export function MetricCard({ label, value, delta, trend }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-gh-green" : "text-amber-400";

  return (
    <article className="aurora-panel glass-card hover-lift rounded-2xl p-5">
      <div className="content-layer">
        <p className="text-sm text-gh-text">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-gh-heading">{value}</p>
        <p className={`mt-2 text-xs font-medium ${trendColor}`}>{delta}</p>
      </div>
    </article>
  );
}
