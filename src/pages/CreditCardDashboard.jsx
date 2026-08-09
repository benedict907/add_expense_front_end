import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useCreditCards,
  currency,
  formatMonth,
  UNASSIGNED,
} from "../context/CreditCardContext";
import { useAuth } from "../context/AuthContext";
import Reveal from "../components/Reveal";
import AnimatedNumber from "../components/AnimatedNumber";
import SyncPanel from "../components/creditcards/SyncPanel";
import CardTile from "../components/creditcards/CardTile";
import OwnerBreakdown from "../components/creditcards/OwnerBreakdown";
import TransactionList from "../components/creditcards/TransactionList";
import MonthTrend from "../components/creditcards/MonthTrend";
import { Card, Alert, Layers, Logout, Receipt } from "../components/Icons";

/**
 * Credit-card module dashboard. Same Vault shell as the expenses dashboard —
 * sticky glass header, reveal-on-scroll cards, lime accent — but its own data,
 * its own routes and its own Firebase namespace.
 */

const MonthPicker = () => {
  const { availableMonths, monthsWithData, selectedMonth, setSelectedMonth } =
    useCreditCards();
  return (
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
  );
};

const HeroSummary = ({ onReviewUnassigned }) => {
  const { totals, selectedMonth } = useCreditCards();
  const hasUnassigned = totals.unassigned > 0;

  return (
    <section className="card card-hover overflow-hidden">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{
          background: hasUnassigned
            ? "radial-gradient(circle, rgba(255,176,58,0.20), transparent 68%)"
            : "radial-gradient(circle, rgba(204,251,79,0.20), transparent 68%)",
        }}
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="tile h-8 w-8 rounded-[11px] text-lime">
              <Card className="h-4 w-4" />
            </span>
            <div>
              <p className="eyebrow">Total credit card spending</p>
              <p className="text-[11px] text-low">{formatMonth(selectedMonth)}</p>
            </div>
          </div>
          <MonthPicker />
        </div>

        <p className="display mt-5 text-[2.75rem] text-gradient-lime sm:text-6xl">
          <AnimatedNumber value={totals.total} format={currency} duration={1100} />
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div className="well p-3.5">
            <div className="flex items-center gap-1.5 text-iris">
              <Receipt className="h-3.5 w-3.5" />
              <span className="eyebrow text-iris/80">Transactions</span>
            </div>
            <p className="tnum mt-1.5 text-lg font-medium text-hi">
              {totals.transactionCount}
            </p>
          </div>

          <div className="well p-3.5">
            <div className="flex items-center gap-1.5 text-violet">
              <Layers className="h-3.5 w-3.5" />
              <span className="eyebrow text-violet/80">EMI billed</span>
            </div>
            <p className="tnum mt-1.5 text-lg font-medium text-hi">
              <AnimatedNumber value={totals.emiTotal} format={currency} />
            </p>
          </div>

          {/* Unassigned is the thing that needs action, so it gets the loudest
              treatment and doubles as the shortcut into the review queue. */}
          <button
            type="button"
            onClick={onReviewUnassigned}
            disabled={!hasUnassigned}
            className="well col-span-2 p-3.5 text-left transition-colors duration-200 disabled:opacity-70 sm:col-span-1"
            style={
              hasUnassigned
                ? {
                    background: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
                    borderColor: "color-mix(in srgb, var(--color-amber) 32%, transparent)",
                  }
                : undefined
            }
          >
            <div className="flex items-center gap-1.5 text-amber">
              <Alert className="h-3.5 w-3.5" />
              <span className="eyebrow text-amber/90">Unassigned</span>
            </div>
            <p className="tnum mt-1.5 text-lg font-medium text-amber">
              <AnimatedNumber value={totals.unassigned} format={currency} />
            </p>
            <p className="mt-0.5 text-[11px] text-amber/80">
              {hasUnassigned
                ? `Review ${totals.unassignedCount} transaction${
                    totals.unassignedCount === 1 ? "" : "s"
                  }`
                : "Everything assigned"}
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

const DashboardBody = () => {
  const { cardSummaries, loading, cards } = useCreditCards();
  const [ownerFilter, setOwnerFilter] = useState(null);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <Reveal className="mb-6">
        <p className="text-[13px] text-low">Credit cards</p>
        <h1 className="mt-0.5 text-[1.75rem] font-semibold leading-tight text-hi sm:text-4xl">
          Statements, <span className="text-gradient-lime">split by person</span>
        </h1>
      </Reveal>

      <Reveal>
        <HeroSummary onReviewUnassigned={() => setOwnerFilter(UNASSIGNED)} />
      </Reveal>

      {cards.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cardSummaries.map((summary, i) => (
            <Reveal key={summary.card.id} delay={i * 60}>
              <CardTile summary={summary} />
            </Reveal>
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="card mt-4 flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="tile h-10 w-10 text-low">
            <Card className="h-5 w-5" />
          </span>
          <p className="text-sm text-mid">No cards configured yet</p>
          <p className="max-w-sm text-xs text-low">
            Add your cards to <code className="text-mid">creditcards/cards.json</code> on
            the backend, then run a sync — they appear here automatically.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Reveal delay={40}>
            <TransactionList
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
            />
          </Reveal>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <Reveal delay={60}>
            <SyncPanel />
          </Reveal>
          <Reveal delay={80}>
            <OwnerBreakdown activeOwner={ownerFilter} onSelectOwner={setOwnerFilter} />
          </Reveal>
          <Reveal delay={100}>
            <MonthTrend />
          </Reveal>
        </div>
      </div>

      <footer className="mt-10 pb-4 text-center text-[11px] text-low">
        Vault · credit cards
      </footer>
    </div>
  );
};

export const CreditCardHeader = () => {
  const { signOut, authAvailable } = useAuth();
  const today = new Date();

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{
              background: "linear-gradient(140deg,#e2ff8a,var(--color-lime) 55%,#9ad70c)",
              boxShadow: "0 6px 18px -8px rgba(204,251,79,0.6)",
            }}
          >
            <Card className="h-4 w-4" style={{ color: "#0b1000" }} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-hi">
              Cards
            </p>
            <p className="truncate text-[11px] leading-tight text-low">
              {today.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link to="/" className="btn btn-soft px-3.5 py-2 text-[13px]">
            Dashboard
          </Link>
          {authAvailable && (
            <button
              onClick={signOut}
              className="btn-icon"
              title="Sign out"
              aria-label="Sign out"
            >
              <Logout className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// The provider lives in CreditCardLayout so the selected month survives
// navigation between the dashboard and a statement.
const CreditCardDashboard = () => (
  <div className="min-h-dvh pb-20 lg:pb-16">
    <CreditCardHeader />
    <DashboardBody />
  </div>
);

export default CreditCardDashboard;
