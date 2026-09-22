import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useCreditCards,
  currency,
  ownerAmount,
  UNASSIGNED,
} from "../../context/CreditCardContext";
import { Card, Alert, Copy, Check } from "../Icons";

/** YYYY-MM-DD from an ISO timestamp, in local time so the date never shifts. */
const isoDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso).slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Tab-separated so a paste into Google Sheets lands one column per field. */
const statementToClipboardText = (transactions) =>
  transactions
    .slice()
    .sort((a, b) => (a.transactionDate || "").localeCompare(b.transactionDate || ""))
    .map((txn) => [isoDate(txn.transactionDate), txn.description, ownerAmount(txn).toFixed(2)].join("\t"))
    .join("\n");

/** Stable per-card accent so a card keeps its colour across the dashboard. */
const HUES = [
  "var(--color-lime)",
  "var(--color-iris)",
  "var(--color-violet)",
  "var(--color-amber)",
  "var(--color-mint)",
  "var(--color-coral)",
];

export const cardHue = (cardId = "") => {
  let hash = 0;
  for (let i = 0; i < cardId.length; i += 1) hash = (hash * 31 + cardId.charCodeAt(i)) >>> 0;
  return HUES[hash % HUES.length];
};

const CardTile = ({ summary }) => {
  const { ownersById, selectedMonth, monthTransactions } = useCreditCards();
  const { card, statement, total, byOwner, unassignedCount } = summary;
  const hue = cardHue(card.id);
  const unassignedAmount = byOwner[UNASSIGNED] || 0;
  const [copied, setCopied] = useState(false);

  const ownerRows = Object.entries(byOwner)
    .filter(([ownerId]) => ownerId !== UNASSIGNED)
    .sort((a, b) => b[1] - a[1]);

  const cardTransactions = monthTransactions.filter((txn) => txn.cardId === card.id);

  const copyStatement = async () => {
    const text = statementToClipboardText(cardTransactions);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${hue} 22%, transparent), transparent 70%)` }}
      />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${hue} 15%, transparent)` }}
          >
            <Card className="h-4 w-4" style={{ color: hue }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight text-hi">
              {card.cardName}
            </p>
            <p className="tnum truncate text-[11px] text-low">
              {card.bankName}
              {card.lastFourDigits ? ` ·  ${card.lastFourDigits}` : ""}
            </p>
          </div>
          {cardTransactions.length > 0 && (
            <button
              type="button"
              onClick={copyStatement}
              title="Copy statement (paste into Google Sheets)"
              className="btn btn-soft grid h-8 w-8 shrink-0 place-items-center !p-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <p className="eyebrow mt-4">Current statement</p>
        <p className="display mt-1 text-[1.75rem] text-hi">{currency(total)}</p>

        {statement?.dueDate && (
          <p className="tnum mt-1 text-[11px] text-low">
            Due{" "}
            {new Date(statement.dueDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
            {statement.totalAmount != null && ` · Total due ${currency(statement.totalAmount)}`}
          </p>
        )}

        {!statement && (
          <p className="mt-1 text-[11px] text-amber">No statement imported yet</p>
        )}

        <div className="mt-4 flex-1 space-y-1.5">
          {ownerRows.map(([ownerId, amount]) => (
            <div key={ownerId} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate text-mid">
                {ownersById[ownerId]?.name || "Unknown"}
              </span>
              <span className="tnum shrink-0 text-hi">{currency(amount)}</span>
            </div>
          ))}

          {unassignedAmount > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-amber/10 px-2 py-1.5 text-[12px]">
              <span className="flex items-center gap-1.5 truncate font-semibold text-amber">
                <Alert className="h-3.5 w-3.5 shrink-0" />
                Unassigned ({unassignedCount})
              </span>
              <span className="tnum shrink-0 font-semibold text-amber">
                {currency(unassignedAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Carry the month so a reload on the statement page stays put. */}
        <Link
          to={`/credit-cards/${encodeURIComponent(card.id)}?month=${selectedMonth}`}
          className="btn btn-soft mt-4 w-full py-2.5 text-[13px]"
        >
          View statement
        </Link>
      </div>
    </article>
  );
};

export default CardTile;
