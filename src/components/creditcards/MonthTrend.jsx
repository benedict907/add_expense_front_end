import React, { useState } from "react";
import Segmented from "../Segmented";
import {
  useCreditCards,
  currency,
  formatMonth,
  UNASSIGNED,
} from "../../context/CreditCardContext";
import { cardHue } from "./CardTile";

/**
 * Month-over-month totals, split by whatever dimension you pick.
 * Bars only — the useful question here is "how does this month compare", and a
 * column chart answers it without decoration.
 */
const MonthTrend = () => {
  const { monthlyTrend, cardsById, ownersById, selectedMonth, setSelectedMonth } =
    useCreditCards();
  const [mode, setMode] = useState("total");

  const series = monthlyTrend.slice(-6);
  // A single bar is not a trend — it just renders as a full-width block. Wait
  // until there is something to compare against.
  if (series.length < 2) return null;

  const max = Math.max(1, ...series.map((month) => month.total));

  const segmentsFor = (bucket) => {
    if (mode === "total") {
      return [{ key: "total", value: bucket.total, hue: "var(--color-lime)" }];
    }
    if (mode === "emi") {
      return [{ key: "emi", value: bucket.emi, hue: "var(--color-violet)" }];
    }
    if (mode === "card") {
      return Object.entries(bucket.byCard).map(([cardId, value]) => ({
        key: cardId,
        value,
        hue: cardHue(cardId),
        label: cardsById[cardId]?.cardName || cardId,
      }));
    }
    return Object.entries(bucket.byOwner).map(([ownerId, value]) => ({
      key: ownerId,
      value,
      hue:
        ownerId === UNASSIGNED
          ? "var(--color-amber)"
          : ownersById[ownerId]?.color || "var(--color-mint)",
      label: ownerId === UNASSIGNED ? "Unassigned" : ownersById[ownerId]?.name || ownerId,
    }));
  };

  return (
    <section className="card card-hover p-5 sm:p-6">
      <div className="mb-4">
        <p className="eyebrow">Trend</p>
        <p className="mt-0.5 text-[11px] text-low">Last {series.length} months</p>
      </div>

      <Segmented
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: "total", label: "Total", fill: "rgba(204,251,79,0.16)" },
          { value: "card", label: "By card", fill: "rgba(125,141,255,0.16)" },
          { value: "owner", label: "By person", fill: "rgba(69,224,189,0.16)" },
          { value: "emi", label: "EMI", fill: "rgba(189,140,255,0.16)" },
        ]}
      />

      <div className="mt-5 flex h-40 items-end gap-2">
        {series.map((bucket) => {
          const segments = segmentsFor(bucket).filter((s) => s.value > 0);
          const barTotal = segments.reduce((sum, s) => sum + s.value, 0);
          const heightPct = (barTotal / max) * 100;
          const active = bucket.month === selectedMonth;

          return (
            <button
              key={bucket.month}
              type="button"
              onClick={() => setSelectedMonth(bucket.month)}
              className="group flex h-full flex-1 flex-col justify-end gap-1.5"
              title={`${formatMonth(bucket.month)} · ${currency(barTotal)}`}
            >
              <span className="tnum text-center text-[10px] text-low opacity-0 transition-opacity group-hover:opacity-100">
                {currency(barTotal)}
              </span>
              <span
                className="flex w-full flex-col-reverse overflow-hidden rounded-lg transition-all duration-500"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              >
                {segments.map((segment) => (
                  <span
                    key={segment.key}
                    className="w-full"
                    style={{
                      height: `${(segment.value / barTotal) * 100}%`,
                      background: segment.hue,
                      opacity: active ? 1 : 0.55,
                    }}
                  />
                ))}
              </span>
              <span
                className={`text-center text-[10px] ${
                  active ? "font-semibold text-hi" : "text-low"
                }`}
              >
                {bucket.month.slice(5)}/{bucket.month.slice(2, 4)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MonthTrend;
