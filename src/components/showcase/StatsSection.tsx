import { GALLERY, STATS } from "@/content/showcase-data";
import { DonutChart, GenderGlyph, Gauge } from "./charts";

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
        <span className="capitalize">{label}</span>
        <span className="text-white">
          {value}
          {suffix && <span className="ml-1 text-gray-500">{suffix}</span>}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-brand-dark-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
        {caption && <span className="shrink-0 text-[10px] text-gray-600">{caption}</span>}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function sayLabel(text: string, kind: string) {
  return kind === "japanese" ? text : text.replace(/_/g, " ");
}

const FUNNEL_LABELS = {
  started: "Started a character",
  photoUploaded: "Uploaded a photo",
  bodyGenerated: "Generated a body render",
  completed: "Fully rigged & textured",
} satisfies Record<keyof typeof STATS.funnel, string>;

function FunnelCard({ funnel }: { funnel: typeof STATS.funnel }) {
  const steps = (Object.keys(FUNNEL_LABELS) as (keyof typeof FUNNEL_LABELS)[]).map((key) => ({
    key,
    label: FUNNEL_LABELS[key],
    value: funnel[key],
  }));
  const max = steps[0].value;

  return (
    <StatCard title="Character-creation funnel">
      <div>
        {steps.map((step, i) => {
          const pct = max === 0 ? 0 : Math.round((step.value / max) * 100);
          const prev = i > 0 ? steps[i - 1].value : null;
          const dropPct = prev ? Math.round((1 - step.value / prev) * 100) : null;
          return (
            <div key={step.key}>
              {dropPct !== null && dropPct > 0 && (
                <div className="flex items-center gap-1.5 py-0.5 pl-1 text-[10px] text-gray-600">
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 -scale-x-100" fill="none">
                    <path d="M2 0v6a4 4 0 004 4h4" stroke="currentColor" strokeWidth={1.2} />
                  </svg>
                  <span>{dropPct}% drop-off</span>
                </div>
              )}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1">
                  <p className="mb-1 text-xs text-gray-300">{step.label}</p>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-brand-cyan/70 to-brand-cyan"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-bold text-white">[{step.value}]</span>
              </div>
            </div>
          );
        })}
      </div>
    </StatCard>
  );
}

const MODE_LABELS: Record<string, string> = {
  "1": "Abstract",
  "2": "Lookalike",
  "3": "Realistic character",
};

export function StatsSection() {
  const { funnel, modeDistribution, sayFrequency, demographics, sessionAverages, totals } = STATS;

  const boothCount = GALLERY.filter((g) => g.kind === "booth-session").length;
  const modeEntries = Object.entries(modeDistribution).sort((a, b) => Number(a[0]) - Number(b[0]));
  const modeMax = Math.max(...modeEntries.map(([, v]) => v));
  const modeTotal = modeEntries.reduce((sum, [, v]) => sum + v, 0);
  const sayMax = Math.max(...sayFrequency.map((s) => s.count));
  const genderSegments = Object.entries(demographics.gender).map(([label, value]) => ({ label, value }));
  const overallMood = Number(
    ((sessionAverages.sleep + sessionAverages.arousal + sessionAverages.valence) / 3).toFixed(1),
  );

  return (
    <section id="numbers" className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="mb-2 font-display text-2xl font-bold text-white">By the numbers</h2>
      <p className="mb-10 text-sm text-gray-500">
        A frozen snapshot of everything that ever happened on the platform — {totals.signups} signups,{" "}
        {totals.withDownload} with something to download. Small numbers, honestly reported.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FunnelCard funnel={funnel} />

        <StatCard title="Persona mode switches">
          <div className="flex flex-1 flex-col justify-between">
            <div className="space-y-3">
              {modeEntries.map(([mode, count]) => (
                <Bar key={mode} label={MODE_LABELS[mode] ?? `Mode ${mode}`} value={count} max={modeMax} />
              ))}
            </div>
            <p className="mt-3 border-t border-white/5 pt-3 text-[11px] text-gray-500">
              <span className="font-bold text-white">{modeTotal}</span> total look switches — visitors kept
              flipping between all three.
            </p>
          </div>
        </StatCard>

        <StatCard title="Booth-goer demographics">
          <div className="flex flex-1 flex-col justify-between">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-2 text-xs text-gray-500">Gender</p>
                <div className="flex items-center gap-2">
                  <DonutChart segments={genderSegments} />
                  <div className="space-y-1">
                    {genderSegments.map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <GenderGlyph gender={label} />
                        <span className="text-xs text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500">Age bracket</p>
                <div className="flex flex-col items-start gap-1.5">
                  {Object.entries(demographics.ageBracket).map(([bracket, count]) => (
                    <span
                      key={bracket}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300"
                    >
                      {count} × {bracket}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 border-t border-white/5 pt-3 text-[11px] text-gray-500">
              <span className="font-bold text-white">{boothCount}</span> booth-goers scanned in during the
              live demo.
            </p>
          </div>
        </StatCard>

        <StatCard title="Self-reported mood (booth)">
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-3">
                <Bar label="Sleep score" value={sessionAverages.sleep} max={10} suffix="/ 10" />
                <Bar label="Arousal" value={sessionAverages.arousal} max={10} suffix="/ 10" />
                <Bar label="Valence" value={sessionAverages.valence} max={10} suffix="/ 10" />
              </div>
              <Gauge value={overallMood} />
            </div>
            <p className="mt-3 border-t border-white/5 pt-3 text-[11px] text-gray-500">
              Averages across {boothCount} completed booth sessions, 1–10 scale.
            </p>
          </div>
        </StatCard>
      </div>

      <div className="relative mt-6 rounded-2xl border border-white/10 bg-brand-dark-card/60 p-6 backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-gray-400">
            What the avatar said most
          </h3>
          <span className="hidden shrink-0 text-[10px] text-gray-600 sm:block">
            Top phrase cloud, sized by frequency
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
          {sayFrequency.map(({ text, count, kind }) => {
            const size = 0.75 + Math.min(count / sayMax, 1) * 1.5;
            const color =
              kind === "japanese"
                ? "text-brand-cyan"
                : kind === "preset"
                  ? "text-gray-300"
                  : "text-brand-purple";
            return (
              <span
                key={text}
                className={`font-display font-semibold ${color}`}
                style={{ fontSize: `${size}rem` }}
                title={`said ${count}×`}
              >
                {sayLabel(text, kind)}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
