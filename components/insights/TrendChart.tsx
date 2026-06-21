import type { TrendPoint } from "@/lib/domains/period/periodInsights";

// Domain-agnostic trend chart: hand-rolled inline SVG (no charting library) so it renders
// in a Server Component with zero client JS and a tiny payload. It knows nothing about
// "periods" — it takes labelled numbers plus an optional average line and draws them in the
// Organic-Olive palette. The hard numbers live in the stat cards, so the chart is a
// labelled visual aid (role="img" + summarizing aria-label) rather than a data table.

type TrendChartProps = {
  title: string; // used for the accessible name, e.g. "Cycle length"
  data: TrendPoint[];
  average: number | null;
  unit: string; // e.g. "days" — for the accessible summary
  type?: "line" | "bar";
};

// viewBox units (the SVG scales fluidly to its container width via width="100%").
const W = 320;
const H = 132;
const PAD_X = 14;
const PAD_TOP = 14;
const PAD_BOTTOM = 24; // room for the x-axis month labels

export function TrendChart({ title, data, average, unit, type = "line" }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[132px] items-center justify-center rounded-2xl bg-canvas px-4 text-center">
        <p className="text-sm text-ink/60">Not enough data yet — keep logging.</p>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  // Pad the value domain a little so points/bars don't kiss the edges. Include the average
  // so its reference line always lands inside the frame.
  const lo = Math.min(...values, average ?? Infinity);
  const hi = Math.max(...values, average ?? -Infinity);
  const min = Math.floor(lo - 1);
  const max = Math.ceil(hi + 1);
  const span = Math.max(max - min, 1);

  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH * (1 - (v - min) / span);
  // Evenly space points across the plot; a single point sits centred.
  const x = (i: number) =>
    data.length === 1 ? W / 2 : PAD_X + (plotW * i) / (data.length - 1);

  const avgY = average != null ? y(average) : null;
  const summary = `${title} trend over the last ${data.length} ${
    data.length === 1 ? "entry" : "entries"
  }${average != null ? `, averaging ${average} ${unit}` : ""}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={summary}
      className="overflow-visible"
    >
      {/* Average reference line */}
      {avgY != null && (
        <g data-role="average-line">
          <line
            x1={PAD_X}
            y1={avgY}
            x2={W - PAD_X}
            y2={avgY}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 4"
            className="text-ink/30"
          />
          <text
            x={W - PAD_X}
            y={avgY - 4}
            textAnchor="end"
            className="fill-ink/50 text-[9px]"
          >
            avg {average}
          </text>
        </g>
      )}

      {type === "bar" ? (
        data.map((d, i) => {
          const barW = Math.min((plotW / data.length) * 0.5, 22);
          const topY = y(d.value);
          return (
            <rect
              key={`${d.label}-${i}`}
              x={x(i) - barW / 2}
              y={topY}
              width={barW}
              height={Math.max(H - PAD_BOTTOM - topY, 1)}
              rx={3}
              className="fill-accent"
            />
          );
        })
      ) : (
        <>
          <polyline
            points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-strong"
          />
          {data.map((d, i) => (
            <circle
              key={`${d.label}-${i}`}
              cx={x(i)}
              cy={y(d.value)}
              r={3}
              className="fill-accent-strong"
            />
          ))}
        </>
      )}

      {/* X-axis labels: thin them out when crowded so they stay legible on mobile. */}
      {data.map((d, i) => {
        const step = Math.ceil(data.length / 6);
        const show = i % step === 0 || i === data.length - 1;
        if (!show) return null;
        return (
          <text
            key={`label-${d.label}-${i}`}
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            className="fill-ink/50 text-[9px]"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
