import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";
import { CATEGORIES } from "../constants";

const SummaryCard = () => {
  const {
    income,
    totalSpent,
    totalIncome,
    balance,
    categorySpending,
    budgets,
    setBudget,
    updateIncome,
    getSixMonthProjection,
  } = useBudget();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", amount: "" });
  const [newIncome, setNewIncome] = useState(income);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (newBudget.category && newBudget.amount > 0) {
      setBudget(newBudget.category, parseFloat(newBudget.amount));
      setNewBudget({ category: "", amount: "" });
      setShowBudgetForm(false);
    }
  };

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (newIncome > 0) {
      updateIncome(newIncome);
      setShowIncomeForm(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Financial Summary
      </h2>

      {/* Main Balance Card */}
      <div
        className={`p-4 rounded-lg mb-6 ${
          balance >= 0
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Current Balance</p>
            <p
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatAmount(balance)}
            </p>
          </div>
          <button
            onClick={() => setShowIncomeForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit Income
          </button>
        </div>
      </div>

      {/* Income Form Modal */}
      {showIncomeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Update Income</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Income (₹)
                </label>
                <input
                  value={newIncome}
                  onChange={(e) =>
                    setNewIncome(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Base Income</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatAmount(income)}
          </p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Additional Income</p>
          <p className="text-lg font-semibold text-green-600">
            +{formatAmount(totalIncome)}
          </p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Spent (incl. dues)</p>
          <p className="text-lg font-semibold text-red-600">
            {formatAmount(totalSpent)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-lg font-semibold text-gray-600">
            {formatAmount(income + totalIncome)}
          </p>
        </div>
      </div>

      {/* Budget Management */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800">
            Category Budgets
          </h3>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Budget
          </button>
        </div>

        {/* Budget Form Modal */}
        {showBudgetForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Set Category Budget
              </h3>
              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newBudget.category}
                    onChange={(e) =>
                      setNewBudget((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={newBudget.amount}
                    onChange={(e) =>
                      setNewBudget((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="100"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Set Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBudgetForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(budgets).map(([category, budget]) => {
            const spent = categorySpending[category] || 0;
            const isOver = spent > budget;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;

            return (
              <div key={category} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800">{category}</span>
                  <span
                    className={`text-sm font-medium ${
                      isOver ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {formatAmount(spent)} / {formatAmount(budget)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver
                        ? "bg-red-500"
                        : percentage > 80
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                {isOver && (
                  <p className="text-xs text-red-600 mt-1">
                    Over budget by {formatAmount(spent - budget)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6-Month Projection */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          6-Month Projection
        </h3>
        <div className="space-y-2">
          {Object.entries(categorySpending).map(([category, spent]) => (
            <div
              key={category}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span className="text-sm text-gray-600">{category}</span>
              <span className="text-sm font-medium text-gray-800">
                {formatAmount(getSixMonthProjection(category))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
