import React, { useState } from "react";
import { useBudget } from "../context/BudgetContext";

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

  // Filter expenses
  const filteredExpenses = sortedExpenses.filter((expense) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Expenses & Income
        </h2>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {filterType === "all" ? "transactions" : filterType + "s"} found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("date")}
                >
                  Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("category")}
                >
                  Category{" "}
                  {sortBy === "category" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left py-2 px-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("amount")}
                >
                  Amount{" "}
                  {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Note</th>
                <th className="text-center py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-sm font-medium ${
                        isOverBudget(expense.category)
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {expense.category}
                      {isOverBudget(expense.category) && (
                        <span className="ml-1 text-xs text-red-500">
                          (Over by ₹
                          {getOverspentAmount(
                            expense.category
                          ).toLocaleString()}
                          )
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`font-medium ${
                        expense.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatAmount(expense.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        expense.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {expense.type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600 max-w-xs truncate">
                    {expense.note || "-"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;
