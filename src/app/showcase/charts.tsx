// Small, dependency-free chart/icon primitives for the showcase stats
// section. Kept as plain inline SVG (no charting library) since the data
// volume here is tiny (a handful of categories per chart) — see the plan
// note in src/content/showcase-data.ts.

const DONUT_COLORS = ["#06B6D4", "#8B5CF6", "#22D3EE", "#6D28D9"];

export function DonutChart({ segments }: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  // Precompute each segment's starting offset (as a fraction of the full
  // circle) with reduce, rather than mutating a running total during render.
  const arcs = segments.reduce<{ label: string; value: number; frac: number; startFraction: number }[]>(
    (acc, s) => {
      const frac = total === 0 ? 0 : s.value / total;
      const startFraction = acc.length === 0 ? 0 : acc[acc.length - 1].startFraction + acc[acc.length - 1].frac;
      return [...acc, { ...s, frac, startFraction }];
    },
    [],
  );

  return (
    <svg viewBox="0 0 88 88" className="h-20 w-20 shrink-0 -rotate-90">
      <circle cx={44} cy={44} r={radius} fill="none" stroke="#ffffff14" strokeWidth={10} />
      {arcs.map((s, i) => {
        const dash = s.frac * circumference;
        const offset = -s.startFraction * circumference;
        return (
          <circle
            key={s.label}
            cx={44}
            cy={44}
            r={radius}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth={10}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function Gauge({ value, min = 1, max = 10 }: { value: number; min?: number; max?: number }) {
  const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <svg viewBox="0 0 100 56" className="h-14 w-24">
      <path
        d="M 8 50 A 42 42 0 0 1 92 50"
        fill="none"
        stroke="#ffffff14"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d="M 8 50 A 42 42 0 0 1 92 50"
        fill="none"
        stroke="#22D3EE"
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 * (1 - fraction)}
      />
      <text x={8} y={56} className="fill-gray-600" fontSize={8}>
        {min}
      </text>
      <text x={84} y={56} className="fill-gray-600" fontSize={8}>
        {max}
      </text>
      <text x={50} y={44} textAnchor="middle" className="fill-white font-bold" fontSize={16}>
        {value}
      </text>
    </svg>
  );
}

export function GenderGlyph({ gender }: { gender: string }) {
  const symbol = gender === "female" ? "♀" : gender === "male" ? "♂" : "?";
  const color = gender === "female" ? "text-brand-purple" : "text-brand-cyan";
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold ${color}`}
    >
      {symbol}
    </span>
  );
}
