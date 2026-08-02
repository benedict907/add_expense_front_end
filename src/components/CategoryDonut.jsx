import React, { useMemo, useState } from "react";
import { categoryVisual } from "./Icons";

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 3; // degrees of breathing room between arcs

const HUES = [
  "var(--color-lime)",
  "var(--color-iris)",
  "var(--color-mint)",
  "var(--color-violet)",
  "var(--color-amber)",
  "var(--color-coral)",
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Category split donut. Arcs animate in via stroke-dashoffset, and hovering
 * a slice or a legend row lifts that slice and swaps the centre readout.
 */
const CategoryDonut = ({ spending = {} }) => {
  const [active, setActive] = useState(null);

  const { slices, total } = useMemo(() => {
    const entries = Object.entries(spending)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    const sum = entries.reduce((s, [, v]) => s + v, 0);
    if (sum === 0) return { slices: [], total: 0 };

    let cursor = 0;
    const out = entries.map(([name, value], i) => {
      const share = value / sum;
      const slice = {
        name,
        value,
        share,
        hue: HUES[i % HUES.length],
        offset: cursor,
      };
      cursor += share;
      return slice;
    });

    return { slices: out, total: sum };
  }, [spending]);

  if (slices.length === 0) return null;

  const shown = active === null ? null : slices[active];

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0" onMouseLeave={() => setActive(null)}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="15"
          />
          {slices.map((s, i) => {
            const len = Math.max(s.share * CIRC - GAP, 1);
            const isOn = active === i;
            const dim = active !== null && !isOn;
            return (
              <circle
                key={s.name}
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke={s.hue}
                strokeWidth={isOn ? 18 : 15}
                strokeLinecap="round"
                strokeDasharray={`${len} ${CIRC - len}`}
                strokeDashoffset={-s.offset * CIRC}
                onMouseEnter={() => setActive(i)}
                style={{
                  opacity: dim ? 0.25 : 1,
                  cursor: "pointer",
                  transition:
                    "stroke-width .28s var(--ease), opacity .28s var(--ease)",
                  animation: `donut-draw .9s var(--ease) ${i * 90}ms both`,
                }}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="tnum text-lg font-medium leading-tight text-hi">
            {fmt(shown ? shown.value : total)}
          </p>
          <p className="mt-0.5 max-w-full truncate text-[11px] text-low">
            {shown ? shown.name : "Total spent"}
          </p>
        </div>

        <style>{`
          @keyframes donut-draw {
            from { stroke-dasharray: 0 ${CIRC}; }
          }
        `}</style>
      </div>

      <ul className="w-full min-w-0 space-y-1.5">
        {slices.slice(0, 6).map((s, i) => {
          const { Icon } = categoryVisual(s.name);
          return (
            <li key={s.name}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors duration-200 hover:bg-white/5"
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${s.hue} 18%, transparent)` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: s.hue }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-mid">
                  {s.name}
                </span>
                <span className="tnum shrink-0 text-[13px] text-hi">
                  {Math.round(s.share * 100)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CategoryDonut;
