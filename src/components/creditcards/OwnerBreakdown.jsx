import React from "react";
import {
  useCreditCards,
  currency,
  UNASSIGNED,
} from "../../context/CreditCardContext";
import { Alert } from "../Icons";

/**
 * Spend by person for the selected month, with a meter per owner.
 * Clicking a row filters the transaction list to that person.
 */
const OwnerBreakdown = ({ activeOwner, onSelectOwner }) => {
  const { owners, ownersById, totals } = useCreditCards();

  const rows = [
    ...owners.map((owner) => ({
      id: owner.ownerId,
      name: owner.name,
      color: owner.color || "var(--color-mint)",
      amount: totals.byOwner[owner.ownerId] || 0,
    })),
    {
      id: UNASSIGNED,
      name: "Unassigned",
      color: "var(--color-amber)",
      amount: totals.byOwner[UNASSIGNED] || 0,
      warn: true,
    },
    // Only people who actually spent this month. Owners you have set up but
    // who have nothing on these statements are noise here — they are still
    // offered when assigning a transaction. The active filter is kept even at
    // zero so "Clear filter" stays reachable.
  ].filter((row) => row.amount > 0 || row.id === activeOwner);

  const max = Math.max(1, ...rows.map((row) => row.amount));

  return (
    <section className="card card-hover p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="eyebrow">Spending by person</p>
        {activeOwner && (
          <button
            type="button"
            onClick={() => onSelectOwner(null)}
            className="chip"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const active = activeOwner === row.id;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelectOwner(active ? null : row.id)}
              aria-pressed={active}
              className="w-full rounded-xl px-2 py-2 text-left transition-colors duration-200"
              style={{
                background: active
                  ? `color-mix(in srgb, ${row.color} 12%, transparent)`
                  : "transparent",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="flex min-w-0 items-center gap-1.5 truncate text-[13px] font-medium"
                  style={{ color: row.warn ? "var(--color-amber)" : "var(--color-hi)" }}
                >
                  {row.warn && <Alert className="h-3.5 w-3.5 shrink-0" />}
                  {row.name}
                </span>
                <span
                  className="tnum shrink-0 text-[13px] font-medium"
                  style={{ color: row.warn ? "var(--color-amber)" : "var(--color-hi)" }}
                >
                  {currency(row.amount)}
                </span>
              </div>
              <div className="meter mt-2 h-1.5">
                <div
                  className="meter-fill"
                  style={{
                    width: `${(row.amount / max) * 100}%`,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${row.color} 55%, white), ${row.color})`,
                  }}
                />
              </div>
            </button>
          );
        })}

        {rows.length === 0 && (
          <p className="py-6 text-center text-[13px] text-low">
            Nothing imported for this month yet.
          </p>
        )}
      </div>
    </section>
  );
};

export default OwnerBreakdown;
