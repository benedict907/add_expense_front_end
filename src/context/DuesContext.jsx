import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ref, onValue } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useAuth } from "./AuthContext";

const DUES_REF_KEY = "dues";
const STORAGE_PREFIX = "budgetDues_";

function pathWithRoot(dataRoot, ...segments) {
  const joined = segments.filter(Boolean).join("/");
  return dataRoot ? `${dataRoot}/${joined}` : joined;
}

const DuesContext = createContext({
  dues: [],
  allDues: [],
  totalDuesAmount: 0,
  totalPaidDuesAmount: 0,
});

function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function toDue(id, row, monthKey) {
  return {
    id,
    monthKey,
    name: row.name ?? "",
    amount: row.amount ?? 0,
    dueDate: row.dueDate ?? "",
    status: row.status ?? "pending",
    // Which card this settles, if any. Absent means an ordinary bill.
    account: row.account ?? "",
    source: row.source ?? "",
  };
}

/**
 * Every month's dues, flattened from `dues/<month>/<id>`.
 *
 * The list deliberately reaches past the current month: a card bill paid in
 * September settles August's swipes, and that settlement has to keep counting
 * when you are looking at October.
 */
function snapshotToAllDues(snapshot) {
  const data = snapshot.val();
  if (!data) return [];
  const flat = [];
  Object.entries(data).forEach(([monthKey, rows]) => {
    Object.entries(rows || {}).forEach(([id, row]) => {
      if (row && typeof row === "object") flat.push(toDue(id, row, monthKey));
    });
  });
  return flat;
}

const dueKey = (due) =>
  [due.id, due.monthKey, due.amount, due.status, due.dueDate, due.account, due.name].join("|");

const sameDues = (a, b) =>
  a.length === b.length && a.every((due, i) => dueKey(due) === dueKey(b[i]));

export const useDues = () => {
  const context = useContext(DuesContext);
  return (
    context ?? { dues: [], allDues: [], totalDuesAmount: 0, totalPaidDuesAmount: 0 }
  );
};

export const DuesProvider = ({ children }) => {
  const { dataRoot } = useAuth();
  const currentMonthKey = getMonthKey(new Date());
  const [allDues, setAllDues] = useState([]);

  useEffect(() => {
    if (!firebaseDb) {
      // localStorage keeps one bucket per month, same shape as Firebase.
      const flat = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key?.startsWith(STORAGE_PREFIX)) continue;
        const monthKey = key.slice(STORAGE_PREFIX.length);
        try {
          JSON.parse(localStorage.getItem(key) ?? "[]").forEach((row) =>
            flat.push(toDue(row.id, row, monthKey))
          );
        } catch {
          // A corrupt bucket should not take the whole dashboard down.
        }
      }
      setAllDues(flat);
      return;
    }
    if (!dataRoot) return;
    const duesRef = ref(firebaseDb, pathWithRoot(dataRoot, DUES_REF_KEY));
    const unsub = onValue(duesRef, (snapshot) => {
      setAllDues(snapshotToAllDues(snapshot));
    });
    return () => unsub();
  }, [dataRoot]);

  // NextMonthDues pushes its local list here on every change, from an effect
  // that depends on this function. Returning the previous state unchanged when
  // nothing moved is what stops that from becoming a render loop.
  const setDuesFromLocal = useCallback(
    (nextDues) => {
      if (firebaseDb) return;
      const rows = Array.isArray(nextDues) ? nextDues : [];
      setAllDues((prev) => {
        const next = [
          ...prev.filter((due) => due.monthKey !== currentMonthKey),
          ...rows.map((row) => toDue(row.id, row, currentMonthKey)),
        ];
        return sameDues(prev, next) ? prev : next;
      });
    },
    [currentMonthKey]
  );

  // The UI still works month by month; only the money math looks wider.
  const dues = allDues.filter((due) => due.monthKey === currentMonthKey);

  const totalDuesAmount = dues.reduce((sum, due) => sum + (due.amount || 0), 0);
  const totalPaidDuesAmount = dues
    .filter((due) => due.status === "paid")
    .reduce((sum, due) => sum + (due.amount || 0), 0);

  const value = {
    dues,
    allDues,
    totalDuesAmount,
    totalPaidDuesAmount,
    currentMonthKey,
    setDuesFromLocal,
  };

  return <DuesContext.Provider value={value}>{children}</DuesContext.Provider>;
};
