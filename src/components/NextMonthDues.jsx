import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update, get } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useDues } from "../context/DuesContext";

const DUES_REF_KEY = "dues";

function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getPrevMonthKey(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

function snapshotToDues(snapshot) {
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, row]) => ({
    id,
    name: row.name ?? "",
    amount: row.amount ?? 0,
    dueDate: row.dueDate ?? "",
    status: row.status ?? "pending",
  }));
}

const STORAGE_PREFIX = "budgetDues_";

const FILTER_ALL = "all";
const FILTER_PENDING = "pending";
const FILTER_PAID = "paid";

const NextMonthDues = () => {
  const currentMonthKey = getMonthKey(new Date());
  const prevMonthKey = getPrevMonthKey(currentMonthKey);
  const { setDuesFromLocal } = useDues();

  const [dues, setDues] = useState([]);
  const [filter, setFilter] = useState(FILTER_ALL);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDue, setNewDue] = useState({
    name: "",
    amount: "",
    dueDate: "",
  });
  const [duplicating, setDuplicating] = useState(false);

  // Subscribe to Firebase dues for this month
  useEffect(() => {
    if (!firebaseDb) {
      const stored = localStorage.getItem(STORAGE_PREFIX + currentMonthKey);
      if (stored) setDues(JSON.parse(stored));
      return;
    }
    const duesRef = ref(firebaseDb, `${DUES_REF_KEY}/${currentMonthKey}`);
    const unsub = onValue(duesRef, (snapshot) => {
      setDues(snapshotToDues(snapshot));
    });
    return () => unsub();
  }, [currentMonthKey]);

  // Persist to localStorage and sync to DuesContext when not using Firebase
  useEffect(() => {
    if (firebaseDb) return;
    localStorage.setItem(
      STORAGE_PREFIX + currentMonthKey,
      JSON.stringify(dues)
    );
    setDuesFromLocal(dues);
  }, [currentMonthKey, dues, setDuesFromLocal]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return "text-red-600 bg-red-100";
    if (days <= 3) return "text-orange-600 bg-orange-100";
    if (days <= 7) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getStatusText = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return "Overdue";
    if (days === 0) return "Due Today";
    if (days === 1) return "Due Tomorrow";
    return `${days} days left`;
  };

  const handleAddDue = (e) => {
    e.preventDefault();
    if (!newDue.name || !newDue.amount || !newDue.dueDate) return;
    const payload = {
      name: newDue.name.trim(),
      amount: parseFloat(newDue.amount),
      dueDate: newDue.dueDate,
      status: "pending",
    };
    if (firebaseDb) {
      const duesRef = ref(firebaseDb, `${DUES_REF_KEY}/${currentMonthKey}`);
      push(duesRef, payload);
    } else {
      setDues((prev) => [...prev, { id: Date.now().toString(), ...payload }]);
    }
    setNewDue({ name: "", amount: "", dueDate: "" });
    setShowAddForm(false);
  };

  const handleDeleteDue = (id) => {
    if (firebaseDb) {
      const dueRef = ref(
        firebaseDb,
        `${DUES_REF_KEY}/${currentMonthKey}/${id}`
      );
      remove(dueRef);
    } else {
      setDues((prev) => prev.filter((due) => due.id !== id));
    }
  };

  const handleMarkPaid = (id) => {
    if (firebaseDb) {
      const dueRef = ref(
        firebaseDb,
        `${DUES_REF_KEY}/${currentMonthKey}/${id}`
      );
      update(dueRef, { status: "paid" });
    } else {
      setDues((prev) =>
        prev.map((due) => (due.id === id ? { ...due, status: "paid" } : due))
      );
    }
  };

  const handleDuplicateFromLastMonth = async () => {
    if (!firebaseDb) {
      const stored = localStorage.getItem(STORAGE_PREFIX + prevMonthKey);
      if (!stored) {
        alert("No dues found for last month.");
        return;
      }
      const lastMonthDues = JSON.parse(stored);
      if (lastMonthDues.length === 0) {
        alert("No dues found for last month.");
        return;
      }
      const [y, m] = currentMonthKey.split("-").map(Number);
      const newDues = lastMonthDues
        .filter((due) => due.dueDate)
        .map((due, i) => {
          const d = new Date(due.dueDate);
          d.setFullYear(y);
          d.setMonth(m - 1);
          return {
            id: `${Date.now()}-${i}`,
            name: due.name,
            amount: due.amount,
            dueDate: d.toISOString().split("T")[0],
            status: "pending",
          };
        });
      setDues((prev) => [...prev, ...newDues]);
      alert(`Duplicated ${newDues.length} due(s) from ${prevMonthKey}.`);
      return;
    }
    setDuplicating(true);
    try {
      const prevRef = ref(firebaseDb, `${DUES_REF_KEY}/${prevMonthKey}`);
      const snapshot = await get(prevRef);
      const data = snapshot.val();
      if (!data || Object.keys(data).length === 0) {
        alert("No dues found for last month.");
        setDuplicating(false);
        return;
      }
      const currentRef = ref(firebaseDb, `${DUES_REF_KEY}/${currentMonthKey}`);
      const [y, m] = currentMonthKey.split("-").map(Number);
      let count = 0;
      for (const [, row] of Object.entries(data)) {
        const dueDate = row.dueDate
          ? (() => {
              const d = new Date(row.dueDate);
              d.setFullYear(y);
              d.setMonth(m - 1);
              return d.toISOString().split("T")[0];
            })()
          : "";
        await push(currentRef, {
          name: row.name ?? "",
          amount: row.amount ?? 0,
          dueDate,
          status: "pending",
        });
        count += 1;
      }
      alert(`Duplicated ${count} due(s) from ${prevMonthKey}.`);
    } catch (err) {
      alert(err?.message ?? "Failed to duplicate from last month.");
    } finally {
      setDuplicating(false);
    }
  };

  const pendingDues = dues
    .filter((due) => due.status !== "paid")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const paidDues = dues
    .filter((due) => due.status === "paid")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const totalPending = pendingDues.reduce(
    (sum, due) => sum + (due.amount || 0),
    0
  );
  const totalPaid = paidDues.reduce((sum, due) => sum + (due.amount || 0), 0);
  const totalAll = totalPending + totalPaid;

  const filteredDues =
    filter === FILTER_PAID
      ? paidDues
      : filter === FILTER_PENDING
      ? pendingDues
      : [...pendingDues, ...paidDues].sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        );

  const monthLabel = new Date(currentMonthKey + "-01").toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Dues — {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicateFromLastMonth}
            disabled={duplicating}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {duplicating ? "Duplicating…" : `Duplicate from ${prevMonthKey}`}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Due
          </button>
        </div>
      </div>

      {/* Totals: Pending, Paid, All */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-lg font-bold text-amber-700">
            {formatAmount(totalPending)}
          </p>
          <p className="text-xs text-gray-500">{pendingDues.length} items</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Paid</p>
          <p className="text-lg font-bold text-green-700">
            {formatAmount(totalPaid)}
          </p>
          <p className="text-xs text-gray-500">{paidDues.length} items</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Total (all dues)</p>
          <p className="text-lg font-bold text-blue-600">
            {formatAmount(totalAll)}
          </p>
        </div>
      </div>

      {/* Filter: All | Pending | Paid */}
      <div className="flex gap-2 mb-3">
        {[
          [FILTER_ALL, "All"],
          [FILTER_PENDING, "Pending"],
          [FILTER_PAID, "Paid"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add Due Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Add due for {monthLabel}
            </h3>
            <form onSubmit={handleAddDue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Name
                </label>
                <input
                  type="text"
                  value={newDue.name}
                  onChange={(e) =>
                    setNewDue((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Credit Card Payment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newDue.amount}
                  onChange={(e) =>
                    setNewDue((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newDue.dueDate}
                  onChange={(e) =>
                    setNewDue((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Due
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dues List (all, pending, or paid by filter) */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filteredDues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filter === FILTER_ALL
              ? "No dues for this month. Add one or duplicate from last month."
              : filter === FILTER_PENDING
              ? "No pending dues."
              : "No paid dues."}
          </div>
        ) : (
          filteredDues.map((due) => {
            const isPaid = due.status === "paid";
            return (
              <div
                key={due.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 ${
                  isPaid ? "border-green-200 bg-green-50/50" : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3
                      className={`font-medium ${
                        isPaid ? "text-gray-600 line-through" : "text-gray-800"
                      }`}
                    >
                      {due.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(due.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        isPaid ? "text-gray-500" : "text-gray-800"
                      }`}
                    >
                      {formatAmount(due.amount)}
                    </p>
                    {isPaid ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          due.dueDate
                        )}`}
                      >
                        {getStatusText(due.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {isPaid ? null : (
                    <button
                      onClick={() => handleMarkPaid(due.id)}
                      className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDue(due.id)}
                    className="bg-red-100 text-red-600 py-1 px-3 rounded text-sm hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Dues</p>
            <p className="text-lg font-semibold text-gray-800">{dues.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Due This Week</p>
            <p className="text-lg font-semibold text-orange-600">
              {
                pendingDues.filter((due) => getDaysUntilDue(due.dueDate) <= 7)
                  .length
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextMonthDues;
