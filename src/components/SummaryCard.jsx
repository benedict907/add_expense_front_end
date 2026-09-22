import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { CATEGORIES, accountById } from "../constants";
import MoneyInput, { toNumber } from "./MoneyInput";
import Modal from "./Modal";
import AnimatedNumber from "./AnimatedNumber";
import CategoryDonut from "./CategoryDonut";
import {
  categoryVisual,
  Target,
  Plus,
  Wallet,
  TrendUp,
  TrendDown,
  Alert,
  Card,
} from "./Icons";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const SummaryCard = () => {
  const {
    income,
    totalSpent,
    totalIncome,
    spentOnCards,
    balance,
    bankBalance,
    cardOutstanding,
    outstandingByCard,
    categorySpending,
    budgets,
    setBudget,
    updateIncome,
  } = useBudget();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
  const [newIncome, setNewIncome] = useState(String(income));

  const openIncomeForm = () => {
    setNewIncome(String(income));
    setShowIncomeForm(true);
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const amount = toNumber(newBudget.amount);
    if (newBudget.category && amount > 0) {
      setBudget(newBudget.category, amount);
      setNewBudget({ category: "", amount: "" });
      setShowBudgetForm(false);
    }
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    const amount = toNumber(newIncome);
    if (amount > 0) {
      updateIncome(amount);
      setShowIncomeForm(false);
    }
  };

  const positive = balance >= 0;
  const grossIncome = income + totalIncome;
  // Cards you actually owe something on, biggest first.
  const owedCards = Object.entries(outstandingByCard || {})
    .filter(([, owed]) => Math.abs(owed) >= 1)
    .sort((a, b) => b[1] - a[1]);
  // Share of income consumed — drives the hero meter.
  const burn = grossIncome > 0 ? Math.min((totalSpent / grossIncome) * 100, 100) : 0;

  const budgetEntries = Object.entries(budgets);
  const hasSpending = Object.values(categorySpending).some((v) => v > 0);

  return (
    <div className="space-y-4">
      {/* ---------- HERO BALANCE ---------- */}
      <section className="card card-hover overflow-hidden">
        {/* Accent bloom keyed to whether you're in the black */}
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: positive
              ? "radial-gradient(circle, rgba(204,251,79,0.20), transparent 68%)"
              : "radial-gradient(circle, rgba(255,111,94,0.22), transparent 68%)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="tile h-8 w-8 rounded-[11px] text-lime">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="eyebrow">Safe to spend</p>
                <p className="text-[11px] text-low">
                  {new Date().toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={openIncomeForm}
              className="btn btn-soft px-3 py-1.5 text-xs"
            >
              <Target className="h-3.5 w-3.5" />
              Set income
            </button>
          </div>

          <p
            className={`display mt-5 text-[2.75rem] sm:text-6xl ${
              positive ? "text-gradient-lime" : "text-gradient-coral"
            }`}
          >
            <AnimatedNumber value={balance} format={currency} duration={1100} />
          </p>

          {/* The big number is cash less what the cards will claim back. Both
              halves are spelled out so it never looks like money appeared or
              vanished. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-low">
            <span className="tnum">
              {currency(bankBalance)} <span className="text-low">in bank</span>
            </span>
            {cardOutstanding !== 0 && (
              <>
                <span aria-hidden>−</span>
                <span className="tnum text-amber">
                  {currency(cardOutstanding)}{" "}
                  <span className="text-low">owed on cards</span>
                </span>
              </>
            )}
          </p>

          <div className="mt-4 flex items-center gap-2.5">
            <div className="meter flex-1">
              <div
                className="meter-fill"
                style={{
                  width: `${burn}%`,
                  background:
                    burn > 90
                      ? "linear-gradient(90deg,#ff9d8f,var(--color-coral))"
                      : burn > 70
                      ? "linear-gradient(90deg,#ffd08a,var(--color-amber))"
                      : "linear-gradient(90deg,#e6ffa8,var(--color-lime))",
                }}
              />
            </div>
            <span className="tnum shrink-0 text-xs text-mid">
              {Math.round(burn)}% used
            </span>
          </div>

          {/* In / Out tiles — replaces the old dotted-leader ledger rows */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="well p-3.5">
              <div className="flex items-center gap-1.5 text-mint">
                <TrendUp className="h-3.5 w-3.5" />
                <span className="eyebrow text-mint/80">Money in</span>
              </div>
              <p className="tnum mt-1.5 text-lg font-medium text-hi">
                <AnimatedNumber value={grossIncome} format={currency} />
              </p>
              <p className="mt-0.5 text-[11px] text-low">
                {currency(income)} base
                {totalIncome > 0 ? ` · +${currency(totalIncome)} extra` : ""}
              </p>
            </div>

            <div className="well p-3.5">
              <div className="flex items-center gap-1.5 text-coral">
                <TrendDown className="h-3.5 w-3.5" />
                <span className="eyebrow text-coral/80">Money out</span>
              </div>
              <p className="tnum mt-1.5 text-lg font-medium text-hi">
                <AnimatedNumber value={totalSpent} format={currency} />
              </p>
              <p className="mt-0.5 text-[11px] text-low">
                {spentOnCards > 0
                  ? `${currency(spentOnCards)} of it on cards`
                  : "Spends + paid dues"}
              </p>
            </div>
          </div>

          {/* What the cards will come back for. Not spending — this money is
              already counted above; it is a debt waiting for its bill. */}
          {owedCards.length > 0 && (
            <div className="well mt-2.5 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-amber">
                  <Card className="h-3.5 w-3.5" />
                  <span className="eyebrow text-amber/80">Owed on cards</span>
                </div>
                <span className="tnum text-lg font-medium text-hi">
                  <AnimatedNumber value={cardOutstanding} format={currency} />
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {owedCards.map(([id, owed]) => {
                  const { short, hue } = accountById(id);
                  return (
                    <span
                      key={id}
                      className="badge tnum"
                      style={{
                        color: hue,
                        background: `color-mix(in srgb, ${hue} 12%, transparent)`,
                      }}
                    >
                      {short} {currency(owed)}
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-low">
                Already counted in money out. Log the bill payment when you settle it.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- CATEGORY SPLIT ---------- */}
      {hasSpending && (
        <section className="card card-hover p-5 sm:p-6">
          <p className="eyebrow mb-4">Where it went</p>
          <CategoryDonut spending={categorySpending} />
        </section>
      )}

      {/* ---------- BUDGETS ---------- */}
      <section className="card card-hover p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="tile h-8 w-8 rounded-[11px] text-iris">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-hi">Category budgets</p>
              <p className="text-[11px] text-low">
                {budgetEntries.length
                  ? `${budgetEntries.length} tracked`
                  : "Nothing tracked yet"}
              </p>
            </div>
          </div>
          <button onClick={() => setShowBudgetForm(true)} className="chip">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {budgetEntries.length === 0 ? (
          <div className="well flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="tile h-10 w-10 text-low">
              <Target className="h-5 w-5" />
            </span>
            <p className="text-sm text-mid">No budgets set</p>
            <p className="max-w-[15rem] text-xs text-low">
              Cap a category and the meter turns amber before you overshoot.
            </p>
            <button
              onClick={() => setShowBudgetForm(true)}
              className="btn btn-soft mt-1 px-3.5 py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Set your first budget
            </button>
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {budgetEntries.map(([category, budget], i) => {
              const spent = categorySpending[category] || 0;
              const isOver = spent > budget;
              const percentage = budget > 0 ? (spent / budget) * 100 : 0;
              const warn = !isOver && percentage > 80;
              const { Icon, hue } = categoryVisual(category);

              return (
                <div
                  key={category}
                  className="well p-3.5 transition-colors duration-200 hover:border-white/10"
                  style={{ animation: `vault-pop .4s var(--ease) ${i * 45}ms both` }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${hue} 16%, transparent)` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: hue }} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-hi">
                      {category}
                    </span>
                    <span className="tnum shrink-0 text-[13px]">
                      <span className={isOver ? "text-coral" : "text-hi"}>
                        {currency(spent)}
                      </span>
                      <span className="text-low"> / {currency(budget)}</span>
                    </span>
                  </div>

                  <div className="meter mt-2.5 h-1.5">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        background: isOver
                          ? "linear-gradient(90deg,#ff9d8f,var(--color-coral))"
                          : warn
                          ? "linear-gradient(90deg,#ffd08a,var(--color-amber))"
                          : `linear-gradient(90deg, color-mix(in srgb, ${hue} 55%, white), ${hue})`,
                      }}
                    />
                  </div>

                  {isOver && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-coral">
                      <Alert className="h-3.5 w-3.5" />
                      Over by {currency(spent - budget)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- MODALS ---------- */}
      <Modal
        open={showIncomeForm}
        onClose={() => setShowIncomeForm(false)}
        title="Monthly income"
        subtitle="Your baseline for this month"
        icon={<Wallet className="h-4 w-4" />}
      >
        <form onSubmit={handleIncomeSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-2 block">Amount</label>
            <MoneyInput
              value={newIncome}
              onValueChange={setNewIncome}
              quickAdjust={[1000, 5000, 10000]}
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn btn-accent flex-1 py-3">
              Update income
            </button>
            <button
              type="button"
              onClick={() => setShowIncomeForm(false)}
              className="btn btn-soft px-5 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showBudgetForm}
        onClose={() => setShowBudgetForm(false)}
        title="Set category budget"
        subtitle="We'll warn you at 80%"
        icon={<Target className="h-4 w-4" />}
      >
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div>
            <label className="eyebrow mb-2 block">Category</label>
            <select
              value={newBudget.category}
              onChange={(e) =>
                setNewBudget((prev) => ({ ...prev, category: e.target.value }))
              }
              className="field"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow mb-2 block">Monthly budget</label>
            <MoneyInput
              value={newBudget.amount}
              onValueChange={(amount) =>
                setNewBudget((prev) => ({ ...prev, amount }))
              }
              quickAdjust={[500, 1000, 5000]}
              accent="var(--color-iris)"
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn btn-accent flex-1 py-3">
              Set budget
            </button>
            <button
              type="button"
              onClick={() => setShowBudgetForm(false)}
              className="btn btn-soft px-5 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SummaryCard;
