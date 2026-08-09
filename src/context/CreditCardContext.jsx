import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useAuth } from "./AuthContext";
import * as api from "../api/creditCards";

/**
 * Live view of the credit-card namespace in Realtime Database.
 *
 * Deliberately separate from BudgetContext: statements are not expenses and
 * never mix with `<dataRoot>/expenses`. Reads are live subscriptions (same
 * pattern as BudgetContext); writes go through the backend, which owns owner
 * learning and duplicate detection.
 */

const CARDS_KEY = "creditCards";
const OWNERS_KEY = "creditCardOwners";
const STATEMENTS_KEY = "creditCardStatements";
const TRANSACTIONS_KEY = "creditCardTransactions";
const META_KEY = "creditCardMeta";

export const SPEND_TYPES = ["PURCHASE", "EMI", "FEE", "INTEREST"];
export const TYPE_LABELS = {
  PURCHASE: "Purchase",
  EMI: "EMI",
  REFUND: "Refund",
  PAYMENT: "Payment",
  FEE: "Fee",
  INTEREST: "Interest",
  CREDIT: "Credit",
  OTHER: "Other",
};

const UNASSIGNED = "__unassigned__";

const CreditCardContext = createContext(null);

export const useCreditCards = () => {
  const context = useContext(CreditCardContext);
  if (!context) {
    throw new Error("useCreditCards must be used within a CreditCardProvider");
  }
  return context;
};

function pathWithRoot(dataRoot, ...segments) {
  return [dataRoot, ...segments].filter(Boolean).join("/");
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(key) {
  if (!key) return "";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const currencyExact = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);

/** Spending only: payments, refunds and cashback move the balance but are not spend. */
export const isSpend = (txn) => SPEND_TYPES.includes(txn.transactionType);

/**
 * Whether a row belongs to a person.
 *
 * Payments and cashback belong to the card, not to anyone — asking for an owner
 * on them is noise. A refund does belong to someone: it reverses that person's
 * purchase, so it has to reduce their total rather than float free.
 */
export const needsOwner = (txn) => isSpend(txn) || txn.transactionType === "REFUND";

/** Refunds count against the owner's spending; everything else adds to it. */
export const ownerAmount = (txn) =>
  (txn.transactionType === "REFUND" ? -1 : 1) * (Number(txn.amount) || 0);

function toList(snapshotValue, idKey) {
  if (!snapshotValue) return [];
  return Object.entries(snapshotValue).map(([id, row]) => ({ [idKey]: id, ...row }));
}

export const CreditCardProvider = ({ children }) => {
  const { dataRoot } = useAuth();

  const [cards, setCards] = useState([]);
  const [owners, setOwners] = useState([]);
  const [statements, setStatements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);

  // The month lives in the URL (?month=2026-06) so a reload or a shared link
  // opens on the month you were actually looking at.
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get("month");
  const [selectedMonth, setSelectedMonth] = useState(monthParam || monthKey());
  const [syncing, setSyncing] = useState(false);
  const [syncStage, setSyncStage] = useState("");
  const [syncResults, setSyncResults] = useState(null);
  const [syncError, setSyncError] = useState("");

  // ---------- live data ----------

  useEffect(() => {
    if (!firebaseDb || !dataRoot) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);

    const subscriptions = [
      [CARDS_KEY, (value) => setCards(toList(value, "id"))],
      [OWNERS_KEY, (value) => setOwners(toList(value, "ownerId"))],
      [STATEMENTS_KEY, (value) => setStatements(toList(value, "statementId"))],
      [
        TRANSACTIONS_KEY,
        (value) => {
          // Stored as creditCardTransactions/<statementId>/<txnId>; flatten for
          // filtering, keeping the statement id on every row.
          const flat = [];
          Object.entries(value || {}).forEach(([statementId, rows]) => {
            Object.entries(rows || {}).forEach(([txnId, row]) => {
              flat.push({ ...row, statementId, transactionId: txnId });
            });
          });
          setTransactions(flat);
        },
      ],
      [META_KEY, (value) => setLastSync(value?.lastSync ?? null)],
    ].map(([key, apply]) =>
      onValue(ref(firebaseDb, pathWithRoot(dataRoot, key)), (snapshot) => {
        apply(snapshot.val());
        setLoading(false);
      })
    );

    return () => subscriptions.forEach((unsub) => unsub());
  }, [dataRoot]);

  // ---------- derived ----------

  const ownersById = useMemo(() => {
    const map = {};
    owners.forEach((owner) => {
      map[owner.ownerId] = owner;
    });
    return map;
  }, [owners]);

  const cardsById = useMemo(() => {
    const map = {};
    cards.forEach((card) => {
      map[card.id] = card;
    });
    return map;
  }, [cards]);

  /** Months that actually hold statements. */
  const monthsWithData = useMemo(
    () => new Set(statements.map((s) => s.statementMonth).filter(Boolean)),
    [statements]
  );

  /**
   * Months offered in the picker, newest first.
   *
   * Deliberately wider than what has been imported: the sync runs against the
   * selected month, so a picker showing only imported months would make it
   * impossible to ever reach an older one. Empty months are labelled as such.
   */
  const availableMonths = useMemo(() => {
    const months = new Set(monthsWithData);
    const now = new Date();
    for (let i = 0; i < 18; i += 1) {
      months.add(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    }
    return [...months].sort().reverse();
  }, [monthsWithData]);

  // Land on the newest month that actually has statements. Opening on the
  // calendar month shows an empty dashboard for most of every month, since
  // statements arrive mid-cycle. A month the user picks is never overridden.
  const monthChosenRef = useRef(Boolean(monthParam));
  useEffect(() => {
    if (monthChosenRef.current || statements.length === 0) return;
    const withData = [...new Set(statements.map((s) => s.statementMonth).filter(Boolean))]
      .sort()
      .reverse();
    if (withData.length > 0 && !withData.includes(selectedMonth)) {
      setSelectedMonth(withData[0]);
    }
  }, [statements, selectedMonth]);

  const chooseMonth = useCallback(
    (month) => {
      monthChosenRef.current = true;
      setSelectedMonth(month);
      // Replace rather than push: switching months should not fill up the back
      // button before you can use it to leave the page.
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          next.set("month", month);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((txn) => txn.statementMonth === selectedMonth),
    [transactions, selectedMonth]
  );

  const monthStatements = useMemo(
    () => statements.filter((s) => s.statementMonth === selectedMonth),
    [statements, selectedMonth]
  );

  /** Totals for the selected month: overall, per card, per owner. */
  const totals = useMemo(() => {
    const rows = monthTransactions.filter(needsOwner);
    const byCard = {};
    const byOwner = {};
    let total = 0;
    let emiTotal = 0;
    let unassigned = 0;

    rows.forEach((txn) => {
      const amount = ownerAmount(txn);
      total += amount;
      if (txn.isEMI) emiTotal += amount;
      byCard[txn.cardId] = (byCard[txn.cardId] || 0) + amount;
      const key = txn.ownerId || UNASSIGNED;
      byOwner[key] = (byOwner[key] || 0) + amount;
      if (!txn.ownerId) unassigned += amount;
    });

    return {
      total,
      emiTotal,
      unassigned,
      unassignedCount: rows.filter((t) => !t.ownerId).length,
      transactionCount: monthTransactions.length,
      byCard,
      byOwner,
    };
  }, [monthTransactions]);

  /** Per-card breakdown, including cards with no statement this month. */
  const cardSummaries = useMemo(
    () =>
      cards
        .filter((card) => card.active !== false)
        .map((card) => {
          const statement = monthStatements.find((s) => s.cardId === card.id) || null;
          const rows = monthTransactions.filter((t) => t.cardId === card.id);
          const owned = rows.filter(needsOwner);
          const byOwner = {};
          owned.forEach((txn) => {
            const key = txn.ownerId || UNASSIGNED;
            byOwner[key] = (byOwner[key] || 0) + ownerAmount(txn);
          });
          return {
            card,
            statement,
            total: owned.reduce((sum, t) => sum + ownerAmount(t), 0),
            emiTotal: owned
              .filter((t) => t.isEMI)
              .reduce((sum, t) => sum + ownerAmount(t), 0),
            byOwner,
            unassignedCount: owned.filter((t) => !t.ownerId).length,
            transactionCount: rows.length,
          };
        }),
    [cards, monthStatements, monthTransactions]
  );

  /** Month-over-month series for the trend section. */
  const monthlyTrend = useMemo(() => {
    const buckets = {};
    transactions.filter(needsOwner).forEach((txn) => {
      const key = txn.statementMonth;
      if (!key) return;
      const bucket = (buckets[key] ??= { month: key, total: 0, emi: 0, byOwner: {}, byCard: {} });
      const amount = ownerAmount(txn);
      bucket.total += amount;
      if (txn.isEMI) bucket.emi += amount;
      const owner = txn.ownerId || UNASSIGNED;
      bucket.byOwner[owner] = (bucket.byOwner[owner] || 0) + amount;
      bucket.byCard[txn.cardId] = (bucket.byCard[txn.cardId] || 0) + amount;
    });
    return Object.values(buckets).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // ---------- actions ----------

  const runSync = useCallback(
    async ({ month = selectedMonth, cardIds, force = false } = {}) => {
      setSyncing(true);
      setSyncError("");
      setSyncResults(null);
      setSyncStage("Contacting Gmail…");
      try {
        const result = await api.syncStatements({ month, cardIds, force });
        setSyncResults(result);
        setSelectedMonth(month);
        return result;
      } catch (error) {
        setSyncError(error.message || "Sync failed");
        throw error;
      } finally {
        setSyncing(false);
        setSyncStage("");
      }
    },
    [selectedMonth]
  );

  const setOwner = useCallback(
    async (txn, ownerId, { applyRule = true, ruleScope = "card" } = {}) => {
      // The subscription refreshes the row once the backend writes, so there is
      // no optimistic local mutation to unwind on failure.
      return api.assignOwner(txn.statementId, txn.transactionId, {
        ownerId,
        applyRule,
        ruleScope,
      });
    },
    []
  );

  const setOwnerBulk = useCallback(
    (options) => api.assignOwnerBulk({ month: selectedMonth, ...options }),
    [selectedMonth]
  );

  const addOwner = useCallback((name, color) => api.createOwner(name, color), []);

  const value = {
    loading,
    cards,
    cardsById,
    owners,
    ownersById,
    statements,
    transactions,
    lastSync,

    selectedMonth,
    setSelectedMonth: chooseMonth,
    availableMonths,
    monthsWithData,
    monthTransactions,
    monthStatements,
    totals,
    cardSummaries,
    monthlyTrend,

    syncing,
    syncStage,
    syncResults,
    syncError,
    runSync,
    setOwner,
    setOwnerBulk,
    addOwner,

    UNASSIGNED,
  };

  return (
    <CreditCardContext.Provider value={value}>{children}</CreditCardContext.Provider>
  );
};

export { UNASSIGNED };
