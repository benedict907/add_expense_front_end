import React, { useState, useEffect } from "react";
import { ref, onValue, push, remove, update, get } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useDues } from "../context/DuesContext";
import MoneyInput, { toNumber } from "./MoneyInput";
import Modal from "./Modal";
import Segmented from "./Segmented";
import AnimatedNumber from "./AnimatedNumber";
import {
  Bell,
  Plus,
  Copy,
  Check,
  Trash,
  Clock,
  Calendar,
  Note,
  Inbox,
  Pencil,
} from "./Icons";

const DUES_REF_KEY = "dues";

function pathWithRoot(dataRoot, ...segments) {
  const joined = segments.filter(Boolean).join("/");
  return dataRoot ? `${dataRoot}/${joined}` : joined;
}

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
  const { dataRoot } = useAuth();
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
  // The due currently open in the edit sheet: { id, name, amount, dueDate }
  const [editDue, setEditDue] = useState(null);

  // Subscribe to Firebase dues for this month (under user root)
  useEffect(() => {
    if (!firebaseDb) {
      const stored = localStorage.getItem(STORAGE_PREFIX + currentMonthKey);
      if (stored) setDues(JSON.parse(stored));
      return;
    }
    if (!dataRoot) return;
    const duesRef = ref(
      firebaseDb,
      pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey)
    );
    const unsub = onValue(duesRef, (snapshot) => {
      setDues(snapshotToDues(snapshot));
    });
    return () => unsub();
  }, [currentMonthKey, dataRoot]);

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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatAmount0 = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

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

  // Urgency drives colour: overdue coral, imminent amber, soon iris, calm mint.
  const getUrgency = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return { hue: "var(--color-coral)", label: "Overdue" };
    if (days === 0) return { hue: "var(--color-coral)", label: "Due today" };
    if (days === 1) return { hue: "var(--color-amber)", label: "Due tomorrow" };
    if (days <= 3) return { hue: "var(--color-amber)", label: `${days} days left` };
    if (days <= 7) return { hue: "var(--color-iris)", label: `${days} days left` };
    return { hue: "var(--color-mint)", label: `${days} days left` };
  };

  const handleAddDue = (e) => {
    e.preventDefault();
    const amount = toNumber(newDue.amount);
    if (!newDue.name || amount <= 0 || !newDue.dueDate) return;
    const payload = {
      name: newDue.name.trim(),
      amount,
      dueDate: newDue.dueDate,
      status: "pending",
    };
    if (firebaseDb && dataRoot) {
      const duesRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey)
      );
      push(duesRef, payload);
    } else if (!firebaseDb) {
      setDues((prev) => [...prev, { id: Date.now().toString(), ...payload }]);
    }
    setNewDue({ name: "", amount: "", dueDate: "" });
    setShowAddForm(false);
  };

  // Carried-over dues usually need their amount or date corrected, so any due
  // can be reopened and adjusted. Name is kept as-is; only money and timing move.
  const openEditDue = (due) => {
    setEditDue({
      id: due.id,
      name: due.name,
      amount: String(due.amount ?? ""),
      dueDate: due.dueDate ?? "",
    });
  };

  const handleEditDue = (e) => {
    e.preventDefault();
    if (!editDue) return;
    const amount = toNumber(editDue.amount);
    if (amount <= 0 || !editDue.dueDate) return;

    const patch = { amount, dueDate: editDue.dueDate };

    if (firebaseDb && dataRoot) {
      const dueRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey, editDue.id)
      );
      update(dueRef, patch);
    } else if (!firebaseDb) {
      setDues((prev) =>
        prev.map((due) => (due.id === editDue.id ? { ...due, ...patch } : due))
      );
    }
    setEditDue(null);
  };

  const handleDeleteDue = (id) => {
    if (firebaseDb && dataRoot) {
      const dueRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey, id)
      );
      remove(dueRef);
    } else if (!firebaseDb) {
      setDues((prev) => prev.filter((due) => due.id !== id));
    }
  };

  const handleMarkPaid = (id) => {
    if (firebaseDb && dataRoot) {
      const dueRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey, id)
      );
      update(dueRef, { status: "paid" });
    } else if (!firebaseDb) {
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
      const prevRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, prevMonthKey)
      );
      const snapshot = await get(prevRef);
      const data = snapshot.val();
      if (!data || Object.keys(data).length === 0) {
        alert("No dues found for last month.");
        setDuplicating(false);
        return;
      }
      const currentRef = ref(
        firebaseDb,
        pathWithRoot(dataRoot, DUES_REF_KEY, currentMonthKey)
      );
      const [y, m] = currentMonthKey.split("-").map(Number);
      let count = 0;
      for (const [, row] of Object.entries(data)) {
        // Card dues are generated from statements each month and keep their own
        // stable keys. Copying them forward would create hand-made duplicates
        // the generator can no longer keep in step.
        if (row.source === "creditCard") continue;
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

  const dueSoon = pendingDues.filter(
    (due) => getDaysUntilDue(due.dueDate) <= 7
  ).length;

  // Share of the month's dues already cleared.
  const clearedPct = totalAll > 0 ? (totalPaid / totalAll) * 100 : 0;

  return (
    <section className="card card-hover p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="tile h-8 w-8 rounded-[11px] text-amber">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-hi">Dues</p>
            <p className="text-[11px] text-low">{monthLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDuplicateFromLastMonth}
            disabled={duplicating}
            className="chip disabled:opacity-50"
            title={`Carry over dues from ${prevMonthKey}`}
          >
            <Copy className="h-3.5 w-3.5" />
            {duplicating ? "Copying…" : "Carry over"}
          </button>
          <button onClick={() => setShowAddForm(true)} className="chip">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Progress toward clearing the month */}
      <div className="well p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-amber/80">Still to pay</p>
            <p className="tnum mt-1 text-3xl font-medium text-hi">
              <AnimatedNumber value={totalPending} format={formatAmount0} />
            </p>
          </div>
          <div className="text-right">
            <p className="tnum text-sm text-mint">
              {formatAmount0(totalPaid)} cleared
            </p>
            <p className="mt-0.5 text-[11px] text-low">
              {paidDues.length} of {dues.length} paid
            </p>
          </div>
        </div>

        <div className="meter mt-3">
          <div
            className="meter-fill"
            style={{
              width: `${clearedPct}%`,
              background: "linear-gradient(90deg,#7cecd3,var(--color-mint))",
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-low">
            <Clock className="h-3.5 w-3.5" />
            {dueSoon} due within 7 days
          </span>
          <span className="tnum text-low">{formatAmount0(totalAll)} total</span>
        </div>
      </div>

      <Segmented
        className="mt-4"
        size="sm"
        value={filter}
        onChange={setFilter}
        options={[
          { value: FILTER_ALL, label: "All" },
          {
            value: FILTER_PENDING,
            label: `Pending ${pendingDues.length}`,
            fill: "rgba(255,176,58,0.2)",
            text: "var(--color-amber)",
          },
          {
            value: FILTER_PAID,
            label: `Paid ${paidDues.length}`,
            fill: "rgba(69,224,189,0.2)",
            text: "var(--color-mint)",
          },
        ]}
      />

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add a due"
        subtitle={monthLabel}
        icon={<Bell className="h-4 w-4" />}
      >
        <form onSubmit={handleAddDue} className="space-y-4">
          <div>
            <label className="eyebrow mb-2 flex items-center gap-1.5">
              <Note className="h-3.5 w-3.5" />
              Payment name
            </label>
            <input
              type="text"
              value={newDue.name}
              onChange={(e) =>
                setNewDue((prev) => ({ ...prev, name: e.target.value }))
              }
              className="field"
              placeholder="e.g. Credit card payment"
              autoFocus
            />
          </div>
          <div>
            <label className="eyebrow mb-2 block">Amount</label>
            <MoneyInput
              value={newDue.amount}
              onValueChange={(amount) =>
                setNewDue((prev) => ({ ...prev, amount }))
              }
              quickAdjust={[500, 1000, 5000]}
              accent="var(--color-amber)"
            />
          </div>
          <div>
            <label className="eyebrow mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Due date
            </label>
            <input
              type="date"
              value={newDue.dueDate}
              onChange={(e) =>
                setNewDue((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="field tnum"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn btn-accent flex-1 py-3">
              Add due
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-soft px-5 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editDue !== null}
        onClose={() => setEditDue(null)}
        title="Edit due"
        subtitle={editDue?.name}
        icon={<Pencil className="h-4 w-4" />}
      >
        {editDue && (
          <form onSubmit={handleEditDue} className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block">Amount</label>
              <MoneyInput
                value={editDue.amount}
                onValueChange={(amount) =>
                  setEditDue((prev) => ({ ...prev, amount }))
                }
                quickAdjust={[500, 1000, 5000]}
                accent="var(--color-amber)"
                autoFocus
              />
            </div>
            <div>
              <label className="eyebrow mb-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Due date
              </label>
              <input
                type="date"
                value={editDue.dueDate}
                onChange={(e) =>
                  setEditDue((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="field tnum"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={toNumber(editDue.amount) <= 0 || !editDue.dueDate}
                className="btn btn-accent flex-1 py-3"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setEditDue(null)}
                className="btn btn-soft px-5 py-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      <div className="mt-3 max-h-[24rem] space-y-1 overflow-y-auto pr-1">
        {filteredDues.length === 0 ? (
          <div className="well flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="tile h-10 w-10 text-low">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-sm text-mid">
              {filter === FILTER_ALL
                ? "No dues yet"
                : filter === FILTER_PENDING
                ? "Nothing pending"
                : "Nothing paid yet"}
            </p>
            {filter === FILTER_ALL && (
              <p className="max-w-[16rem] text-xs text-low">
                Add one, or carry last month's list over in a tap.
              </p>
            )}
          </div>
        ) : (
          filteredDues.map((due, i) => {
            const isPaid = due.status === "paid";
            const urgency = getUrgency(due.dueDate);
            const hue = isPaid ? "var(--color-mint)" : urgency.hue;

            return (
              <div
                key={due.id}
                className={`group flex items-center gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 transition-colors duration-200 hover:border-white/[0.07] hover:bg-white/[0.035] ${
                  isPaid ? "opacity-55" : ""
                }`}
                style={{
                  animation: `vault-pop .38s var(--ease) ${Math.min(i, 12) * 32}ms both`,
                }}
              >
                <span
                  className="tile h-10 w-10"
                  style={{
                    background: `color-mix(in srgb, ${hue} 13%, transparent)`,
                    borderColor: `color-mix(in srgb, ${hue} 22%, transparent)`,
                    color: hue,
                  }}
                >
                  {isPaid ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[14px] font-medium ${
                      isPaid ? "text-mid line-through" : "text-hi"
                    }`}
                  >
                    {due.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-low">
                    <span className="tnum">{formatDate(due.dueDate)}</span>
                    {isPaid ? (
                      <span className="badge bg-mint/12 text-mint">Paid</span>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          background: `color-mix(in srgb, ${hue} 14%, transparent)`,
                          color: hue,
                        }}
                      >
                        {urgency.label}
                      </span>
                    )}
                  </div>
                </div>

                <p
                  className={`tnum shrink-0 text-[15px] font-medium ${
                    isPaid ? "text-mid" : "text-hi"
                  }`}
                >
                  {formatAmount(due.amount)}
                </p>

                <div className="flex shrink-0 items-center gap-0.5">
                  {!isPaid && (
                    <button
                      onClick={() => handleMarkPaid(due.id)}
                      className="btn-icon h-8 w-8 text-mint hover:!bg-mint/15"
                      title="Mark as paid"
                      aria-label={`Mark ${due.name} as paid`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditDue(due)}
                    className="btn-icon h-8 w-8 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:!text-amber max-sm:opacity-100"
                    title="Edit amount or date"
                    aria-label={`Edit ${due.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDue(due.id)}
                    className="btn-icon h-8 w-8 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:!text-coral max-sm:opacity-100"
                    title="Delete"
                    aria-label={`Delete ${due.name}`}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default NextMonthDues;
