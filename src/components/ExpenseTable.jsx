import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import Segmented from "./Segmented";
import { categoryVisual, Trash, Inbox, Receipt, TrendUp } from "./Icons";

const SORTS = [
  { field: "date", label: "Date" },
  { field: "amount", label: "Amount" },
  { field: "category", label: "Category" },
];

const ExpenseTable = () => {
  const { expenses, deleteExpense, isOverBudget, getOverspentAmount } =
    useBudget();
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("all");

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === "date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === "amount") {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter expenses - only show current month's data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const filteredExpenses = sortedExpenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const isCurrentMonth =
      expenseDate.getMonth() === currentMonth &&
      expenseDate.getFullYear() === currentYear;

    if (!isCurrentMonth) return false;
    if (filterType === "all") return true;
    return expense.type === filterType;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

  const net = filteredExpenses.reduce(
    (sum, e) => sum + (e.type === "income" ? 1 : -1) * (Number(e.amount) || 0),
    0
  );

  return (
    <section className="card card-hover p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="tile h-8 w-8 rounded-[11px] text-violet">
            <Receipt className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-hi">Transactions</p>
            <p className="text-[11px] text-low">
              {filteredExpenses.length} this month
              {filteredExpenses.length > 0 && (
                <>
                  {" · net "}
                  <span
                    className={`tnum ${net >= 0 ? "text-mint" : "text-coral"}`}
                  >
                    {net >= 0 ? "+" : "−"}
                    {formatAmount(Math.abs(net))}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <Segmented
          className="w-[11.5rem] shrink-0"
          size="sm"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: "All" },
            {
              value: "expense",
              label: "Out",
              fill: "rgba(255,111,94,0.22)",
              text: "var(--color-coral)",
            },
            {
              value: "income",
              label: "In",
              fill: "rgba(69,224,189,0.2)",
              text: "var(--color-mint)",
            },
          ]}
        />
      </div>

      {/* Sort chips replace the old clickable table headers */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[11px] text-low">Sort</span>
        {SORTS.map(({ field, label }) => {
          const on = sortBy === field;
          return (
            <button
              key={field}
              onClick={() => handleSort(field)}
              data-active={on}
              className="chip"
              aria-label={`Sort by ${label}, ${
                on ? (sortOrder === "asc" ? "ascending" : "descending") : ""
              }`}
            >
              {label}
              {on && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3 transition-transform duration-300"
                  style={{
                    transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="well flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="tile h-10 w-10 text-low">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="text-sm text-mid">
            No {filterType === "all" ? "entries" : filterType + "s"} yet
          </p>
          <p className="max-w-[16rem] text-xs text-low">
            Anything you record this month lands here instantly.
          </p>
        </div>
      ) : (
        <ul className="-mx-1.5 max-h-[26rem] space-y-1 overflow-y-auto px-1.5">
          {filteredExpenses.map((expense, i) => {
            const income = expense.type === "income";
            const over = isOverBudget(expense.category);
            const overBy = over ? getOverspentAmount(expense.category) : 0;
            const { Icon, hue } = categoryVisual(expense.category);
            const tone = income ? "var(--color-mint)" : hue;

            return (
              <li
                key={expense.id}
                className="group flex items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 transition-colors duration-200 hover:border-white/[0.07] hover:bg-white/[0.035]"
                style={{
                  animation: `vault-pop .38s var(--ease) ${Math.min(i, 12) * 32}ms both`,
                }}
              >
                <span
                  className="tile h-10 w-10"
                  style={{
                    background: `color-mix(in srgb, ${tone} 13%, transparent)`,
                    borderColor: `color-mix(in srgb, ${tone} 22%, transparent)`,
                    color: tone,
                  }}
                >
                  {income ? (
                    <TrendUp className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-hi">
                    {expense.note || expense.category || "Untitled"}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-low">
                    <span className="tnum">{formatDate(expense.date)}</span>
                    <span aria-hidden>·</span>
                    <span className={over ? "text-coral" : ""}>
                      {expense.category}
                    </span>
                    {over && (
                      <span className="badge bg-coral/12 text-coral">
                        over by {formatAmount(overBy)}
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className={`tnum shrink-0 text-[15px] font-medium ${
                    income ? "text-mint" : "text-hi"
                  }`}
                >
                  {income ? "+" : "−"}
                  {formatAmount(expense.amount)}
                </p>

                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="btn-icon h-8 w-8 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:!text-coral max-sm:opacity-100"
                  title="Delete"
                  aria-label={`Delete ${expense.note || expense.category}`}
                >
                  <Trash className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default ExpenseTable;
