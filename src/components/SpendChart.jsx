import React, { useMemo, useState } from "react";

const fmtShort = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
};

const fmtFull = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Daily cash-flow bars for the current month.
 * Expense bars grow down-weighted in coral, income in mint, stacked per day.
 * Hovering (or tapping) a day pins a tooltip — the only interactive chart state.
 */
const SpendChart = ({ expenses = [] }) => {
  const [hover, setHover] = useState(null);

  const { days, max, todayIndex, monthTotal } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const count = new Date(year, month + 1, 0).getDate();

    const buckets = Array.from({ length: count }, (_, i) => ({
      day: i + 1,
      out: 0,
      in: 0,
    }));

    for (const e of expenses) {
      if (!e.date) continue;
      const d = new Date(e.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const slot = buckets[d.getDate() - 1];
      if (!slot) continue;
      const amt = Number(e.amount) || 0;
      if (e.type === "income") slot.in += amt;
      else slot.out += amt;
    }

    const peak = buckets.reduce((m, b) => Math.max(m, b.out, b.in), 0);
    return {
      days: buckets,
      max: peak || 1,
      todayIndex: now.getDate() - 1,
      monthTotal: buckets.reduce((s, b) => s + b.out, 0),
    };
  }, [expenses]);

  const active = hover === null ? null : days[hover];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Daily flow</p>
          <p className="tnum mt-1 text-2xl font-medium text-hi">
            {fmtFull(active ? active.out : monthTotal)}
          </p>
          <p className="mt-0.5 text-xs text-low">
            {active
              ? `Day ${active.day}${active.in > 0 ? ` · +${fmtShort(active.in)} in` : ""}`
              : "Spent this month"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 text-[11px] text-low">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-coral" /> Out
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-full bg-mint" /> In
          </span>
        </div>
      </div>

      <div
        className="relative mt-4 flex h-28 items-end gap-[2px]"
        onMouseLeave={() => setHover(null)}
      >
        {days.map((d, i) => {
          const outPct = (d.out / max) * 100;
          const inPct = (d.in / max) * 100;
          const isToday = i === todayIndex;
          const isHot = hover === i;
          const empty = d.out === 0 && d.in === 0;

          return (
            <button
              key={d.day}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(isHot ? null : i)}
              aria-label={`Day ${d.day}: ${fmtFull(d.out)} out, ${fmtFull(d.in)} in`}
              className="group relative flex h-full flex-1 cursor-pointer flex-col justify-end gap-[2px] rounded-sm"
              style={{ minWidth: 0 }}
            >
              {/* hover column wash */}
              <span
                className="pointer-events-none absolute inset-x-0 inset-y-0 rounded-[3px] bg-white/[0.05] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ opacity: isHot ? 1 : undefined }}
              />
              {inPct > 0 && (
                <span
                  className="relative w-full rounded-t-[3px] bg-mint/80 transition-[height,opacity] duration-500"
                  style={{
                    height: `${Math.max(inPct * 0.4, 3)}%`,
                    opacity: hover === null || isHot ? 1 : 0.35,
                  }}
                />
              )}
              <span
                className="relative w-full rounded-[3px] transition-[height,opacity] duration-500"
                style={{
                  height: empty ? "3px" : `${Math.max(outPct * 0.85, 4)}%`,
                  opacity: hover === null || isHot ? 1 : 0.3,
                  background: empty
                    ? "rgba(255,255,255,0.07)"
                    : isToday
                    ? "linear-gradient(180deg, var(--color-lime), var(--color-lime-deep))"
                    : "linear-gradient(180deg, #ff8f80, var(--color-coral))",
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-medium text-low">
        <span>1</span>
        <span>{Math.ceil(days.length / 2)}</span>
        <span>{days.length}</span>
      </div>
    </div>
  );
};

export default SpendChart;
