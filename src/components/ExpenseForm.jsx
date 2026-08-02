import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { CATEGORIES } from "../constants";
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
} from "./Icons";

const ExpenseForm = () => {
  const { addExpense } = useBudget();
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = toNumber(formData.amount);
    if (!formData.category || amount <= 0) {
      setError("Pick a category and enter an amount above 0.");
      return;
    }

    addExpense({ ...formData, amount });

    setFormData({
      category: "",
      amount: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    setError("");

    // Brief confirmation on the submit button, then back to normal.
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  const isExpense = formData.type === "expense";
  const accent = isExpense ? "var(--color-coral)" : "var(--color-mint)";

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
          onChange={(type) => setFormData((p) => ({ ...p, type }))}
          options={[
            {
              value: "expense",
              label: "Expense",
              icon: <TrendDown className="h-3.5 w-3.5" />,
              fill: "linear-gradient(140deg,#ff8f80,var(--color-coral))",
              text: "#2a0700",
            },
            {
              value: "income",
              label: "Income",
              icon: <TrendUp className="h-3.5 w-3.5" />,
              fill: "linear-gradient(140deg,#7cecd3,var(--color-mint))",
              text: "#00281f",
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
              placeholder="Optional"
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
            justSaved ? "btn-mint" : isExpense ? "btn-danger" : "btn-mint"
          }`}
        >
          {justSaved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
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
