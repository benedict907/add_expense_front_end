import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import {
  CATEGORIES,
  ACCOUNTS,
  CARD_ACCOUNTS,
  DEFAULT_ACCOUNT,
  accountById,
} from "../constants";
import { EXPENSE, INCOME, CARD_PAYMENT } from "../utils/accounting";
import MoneyInput, { toNumber } from "./MoneyInput";
import Segmented from "./Segmented";
import {
  categoryVisual,
  TrendDown,
  TrendUp,
  Calendar,
  Note,
  Check,
  Plus,
  Card,
  Wallet,
} from "./Icons";

const blankForm = () => ({
  category: "",
  amount: "",
  type: EXPENSE,
  account: DEFAULT_ACCOUNT,
  date: new Date().toISOString().split("T")[0],
  note: "",
});

const currency0 = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const ExpenseForm = () => {
  const { addExpense, outstandingByCard } = useBudget();
  const [formData, setFormData] = useState(blankForm);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const setAmount = (amount) => {
    setFormData((prev) => ({ ...prev, amount }));
    if (error) setError("");
  };

  // Switching mode carries the amount over but resets what no longer applies:
  // income always lands in the bank, a card bill always leaves from a card.
  const setType = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      account:
        type === CARD_PAYMENT
          ? accountById(prev.account).kind === "card"
            ? prev.account
            : CARD_ACCOUNTS[0].id
          : type === INCOME
          ? DEFAULT_ACCOUNT
          : prev.account,
      category: type === CARD_PAYMENT ? "" : prev.category,
    }));
    if (error) setError("");
  };

  const isExpense = formData.type === EXPENSE;
  const isIncome = formData.type === INCOME;
  const isBillPayment = formData.type === CARD_PAYMENT;

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = toNumber(formData.amount);
    if (amount <= 0) {
      setError("Enter an amount above 0.");
      return;
    }
    if (isBillPayment) {
      if (accountById(formData.account).kind !== "card") {
        setError("Pick the card you paid.");
        return;
      }
    } else if (!formData.category) {
      setError("Pick a category and enter an amount above 0.");
      return;
    }

    addExpense({ ...formData, amount });

    setFormData(blankForm());
    setError("");

    // Brief confirmation on the submit button, then back to normal.
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const accent = isBillPayment
    ? "var(--color-iris)"
    : isExpense
    ? "var(--color-coral)"
    : "var(--color-mint)";

  // A bill can only be paid off a card; income only ever arrives in the bank.
  const accountOptions = isBillPayment ? CARD_ACCOUNTS : ACCOUNTS;
  const owedOnSelected = outstandingByCard?.[formData.account] ?? 0;

  return (
    <section className="card card-hover overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="tile h-8 w-8 rounded-[11px]"
          style={{ color: accent }}
        >
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-hi">New entry</p>
          <p className="text-[11px] text-low">Logged to this month</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Segmented
          value={formData.type}
          onChange={setType}
          options={[
            {
              value: EXPENSE,
              label: "Expense",
              icon: <TrendDown className="h-3.5 w-3.5" />,
              fill: "linear-gradient(140deg,#ff8f80,var(--color-coral))",
              text: "#2a0700",
            },
            {
              value: INCOME,
              label: "Income",
              icon: <TrendUp className="h-3.5 w-3.5" />,
              fill: "linear-gradient(140deg,#7cecd3,var(--color-mint))",
              text: "#00281f",
            },
            {
              value: CARD_PAYMENT,
              label: "Card bill",
              icon: <Card className="h-3.5 w-3.5" />,
              fill: "linear-gradient(140deg,#b9a8ff,var(--color-iris))",
              text: "#12042e",
            },
          ]}
        />

        <div>
          <label className="eyebrow mb-2 block">Amount</label>
          <MoneyInput
            value={formData.amount}
            onValueChange={setAmount}
            quickAdjust={[100, 500, 1000]}
            accent={accent}
          />
        </div>

        {/* Paid with / Paid off — the field that decides whether this touches
            the bank balance now or only the card's outstanding. */}
        {!isIncome && (
          <div>
            <label className="eyebrow mb-2 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              {isBillPayment ? "Which card did you pay?" : "Paid with"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {accountOptions.map(({ id, label, short, kind, hue }) => {
                const active = formData.account === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-active={active}
                    onClick={() => {
                      setFormData((p) => ({ ...p, account: id }));
                      if (error) setError("");
                    }}
                    className="chip"
                    style={
                      active
                        ? {
                            color: hue,
                            borderColor: `color-mix(in srgb, ${hue} 40%, transparent)`,
                            background: `color-mix(in srgb, ${hue} 12%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    {kind === "card" ? (
                      <Card className="h-3.5 w-3.5" />
                    ) : (
                      <Wallet className="h-3.5 w-3.5" />
                    )}
                    {isBillPayment ? short : label}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] text-low">
              {isBillPayment ? (
                <>
                  Settles the card. Outstanding on{" "}
                  {accountById(formData.account).short}:{" "}
                  <span className="tnum text-mid">{currency0(owedOnSelected)}</span>
                  . Not counted as new spending.
                </>
              ) : accountById(formData.account).kind === "card" ? (
                "Counts as spending now; your bank balance moves when you pay the bill."
              ) : (
                "Leaves your bank balance straight away."
              )}
            </p>
          </div>
        )}

        {!isBillPayment && (
        <div>
          <label className="eyebrow mb-2 block">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="field"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Tap-to-pick category chips — faster than the native select on mobile */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {CATEGORIES.map((category) => {
              const { Icon, hue } = categoryVisual(category);
              const active = formData.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  data-active={active}
                  onClick={() => {
                    setFormData((p) => ({ ...p, category }));
                    if (error) setError("");
                  }}
                  className="chip"
                  style={
                    active
                      ? {
                          color: hue,
                          borderColor: `color-mix(in srgb, ${hue} 40%, transparent)`,
                          background: `color-mix(in srgb, ${hue} 12%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category}
                </button>
              );
            })}
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="eyebrow mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="field tnum"
            />
          </div>
          <div>
            <label className="eyebrow mb-2 flex items-center gap-1.5">
              <Note className="h-3.5 w-3.5" />
              Note
            </label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder={isBillPayment ? "e.g. August statement" : "Optional"}
              className="field"
            />
          </div>
        </div>

        {error && (
          <p className="anim-fade rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={`btn w-full py-3.5 text-[15px] ${
            justSaved || isIncome ? "btn-mint" : isExpense ? "btn-danger" : "btn-soft"
          }`}
          style={
            !justSaved && isBillPayment
              ? { color: accent, borderColor: `color-mix(in srgb, ${accent} 40%, transparent)` }
              : undefined
          }
        >
          {justSaved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : isBillPayment ? (
            <>
              <Card className="h-4 w-4" />
              Record card payment
            </>
          ) : (
            <>
              {isExpense ? (
                <TrendDown className="h-4 w-4" />
              ) : (
                <TrendUp className="h-4 w-4" />
              )}
              Record {isExpense ? "expense" : "income"}
            </>
          )}
        </button>
      </form>
    </section>
  );
};

export default ExpenseForm;
