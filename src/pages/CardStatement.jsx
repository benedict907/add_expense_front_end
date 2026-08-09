import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useCreditCards,
  currency,
  currencyExact,
  formatMonth,
  UNASSIGNED,
} from "../context/CreditCardContext";
import Reveal from "../components/Reveal";
import TransactionList from "../components/creditcards/TransactionList";
import { CreditCardHeader } from "./CreditCardDashboard";
import { cardHue } from "../components/creditcards/CardTile";
import { Card, Alert, Check } from "../components/Icons";

/** One statement: the bank's own summary figures, then every transaction. */

const dateLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const Figure = ({ label, value, hue, format = currencyExact }) => {
  if (value == null) return null;
  return (
    <div className="well p-3">
      <p className="eyebrow" style={hue ? { color: hue } : undefined}>
        {label}
      </p>
      <p className="tnum mt-1 text-[15px] font-medium text-hi">{format(value)}</p>
    </div>
  );
};

const StatementBody = ({ cardId }) => {
  const {
    cardsById,
    monthStatements,
    monthTransactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    monthsWithData,
    ownersById,
  } = useCreditCards();

  const [ownerFilter, setOwnerFilter] = useState(null);

  const card = cardsById[cardId];
  const statement = monthStatements.find((s) => s.cardId === cardId) || null;
  const rows = monthTransactions.filter((t) => t.cardId === cardId);
  const hue = cardHue(cardId);

  const byOwner = {};
  rows
    .filter((t) => ["PURCHASE", "EMI", "FEE", "INTEREST"].includes(t.transactionType))
    .forEach((txn) => {
      const key = txn.ownerId || UNASSIGNED;
      byOwner[key] = (byOwner[key] || 0) + (Number(txn.amount) || 0);
    });

  const reconciled = statement?.reconciliation === "RECONCILED";
  const mismatch = statement?.reconciliation === "MISMATCH";

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <Reveal className="mb-5">
        <Link
          to={`/credit-cards?month=${selectedMonth}`}
          className="text-[12px] text-low hover:text-hi"
        >
          ‹ All cards
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${hue} 15%, transparent)` }}
            >
              <Card className="h-5 w-5" style={{ color: hue }} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[1.4rem] font-semibold leading-tight text-hi sm:text-3xl">
                {card?.cardName || cardId}
              </h1>
              <p className="tnum text-[12px] text-low">
                {card?.bankName}
                {card?.lastFourDigits ? ` ·  ${card.lastFourDigits}` : ""}
              </p>
            </div>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="field h-9 w-auto py-0 text-[13px]"
            aria-label="Statement month"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
                {monthsWithData.has(month) ? "" : " · not imported"}
              </option>
            ))}
          </select>
        </div>
      </Reveal>

      {!statement ? (
        <div className="card flex flex-col items-center gap-2 px-4 py-12 text-center">
          <span className="tile h-10 w-10 text-amber">
            <Alert className="h-5 w-5" />
          </span>
          <p className="text-sm text-mid">
            No {formatMonth(selectedMonth)} statement imported for this card
          </p>
          <Link to="/credit-cards" className="btn btn-soft mt-1 px-3.5 py-2 text-[13px]">
            Go to sync
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <Reveal>
            <section className="card card-hover p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Statement period</p>
                  <p className="tnum mt-1 text-[13px] text-hi">
                    {dateLabel(statement.statementPeriodStart)} —{" "}
                    {dateLabel(statement.statementPeriodEnd)}
                  </p>
                  <p className="tnum mt-0.5 text-[11px] text-low">
                    Statement date {dateLabel(statement.statementDate)} · Due{" "}
                    {dateLabel(statement.dueDate)}
                  </p>
                </div>

                {reconciled && (
                  <span className="badge bg-mint/12 text-mint">
                    <Check className="h-3 w-3" />
                    Statement reconciled
                  </span>
                )}
                {mismatch && (
                  <span className="badge bg-amber/12 text-amber">
                    <Alert className="h-3 w-3" />
                    Totals don&apos;t match
                  </span>
                )}
              </div>

              {mismatch && (
                <p className="tnum mt-3 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2 text-[12px] leading-relaxed text-amber">
                  Expected {currencyExact(statement.expectedTotal)} · Extracted{" "}
                  {currencyExact(statement.extractedTotal)} · Difference{" "}
                  {currencyExact(Math.abs(statement.difference || 0))}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <Figure label="Total amount due" value={statement.totalAmount} />
                <Figure label="Minimum due" value={statement.minimumDue} />
                <Figure label="Previous balance" value={statement.previousBalance} />
                <Figure label="Payments / credits" value={statement.paymentsCredits} />
                <Figure label="Current purchases" value={statement.purchases} />
                <Figure
                  label="EMI total"
                  value={statement.emiTotal}
                  hue="var(--color-violet)"
                />
                <Figure label="Fees / interest" value={statement.feesInterest} />
                <Figure label="Credit limit" value={statement.creditLimit} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(byOwner)
                  .sort((a, b) => b[1] - a[1])
                  .map(([ownerId, amount]) => {
                    const unassigned = ownerId === UNASSIGNED;
                    const color = unassigned
                      ? "var(--color-amber)"
                      : ownersById[ownerId]?.color || "var(--color-mint)";
                    return (
                      <span
                        key={ownerId}
                        className="badge px-2.5 py-1"
                        style={{
                          color,
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        }}
                      >
                        {unassigned ? "Unassigned" : ownersById[ownerId]?.name || ownerId}
                        <span className="tnum">{currency(amount)}</span>
                      </span>
                    );
                  })}
              </div>

              {statement.attachmentName && (
                <p className="mt-3 truncate text-[11px] text-low">
                  Imported from {statement.attachmentName}
                </p>
              )}
            </section>
          </Reveal>

          <Reveal delay={60}>
            <TransactionList
              cardFilter={cardId}
              showCardColumn={false}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
            />
          </Reveal>
        </div>
      )}

      <footer className="mt-10 pb-4 text-center text-[11px] text-low">
        Vault · credit cards
      </footer>
    </div>
  );
};

const CardStatement = () => {
  const { cardId } = useParams();
  return (
    <div className="min-h-dvh pb-20 lg:pb-16">
      <CreditCardHeader />
      <StatementBody cardId={cardId} />
    </div>
  );
};

export default CardStatement;
