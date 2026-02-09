import React, { createContext, useContext, useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { firebaseDb } from "../firebase";

const DUES_REF_KEY = "dues";
const STORAGE_PREFIX = "budgetDues_";

const DuesContext = createContext({ dues: [], totalDuesAmount: 0 });

function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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

export const useDues = () => {
  const context = useContext(DuesContext);
  return context ?? { dues: [], totalDuesAmount: 0 };
};

export const DuesProvider = ({ children }) => {
  const currentMonthKey = getMonthKey(new Date());
  const [dues, setDues] = useState([]);

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

  const setDuesFromLocal = (nextDues) => {
    if (!firebaseDb) setDues(Array.isArray(nextDues) ? nextDues : []);
  };

  const totalDuesAmount = dues.reduce((sum, due) => sum + (due.amount || 0), 0);

  const value = {
    dues,
    totalDuesAmount,
    currentMonthKey,
    setDuesFromLocal,
  };

  return <DuesContext.Provider value={value}>{children}</DuesContext.Provider>;
};
