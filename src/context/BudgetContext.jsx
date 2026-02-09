import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { ref, onValue, push, remove, set, get } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useDues } from "./DuesContext";

const BudgetContext = createContext();
const EXPENSES_REF_KEY = "expenses";
const TOTAL_INCOME_REF_KEY = "totalIncome";
const INCOME_REF_KEY = "income";

function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};

// Normalize Firebase snapshot to array of expenses with id = Firebase key
function snapshotToExpenses(snapshot) {
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, row]) => ({
    id,
    ...row,
    date:
      row.date ||
      (row.createdAt && new Date(row.createdAt).toISOString().split("T")[0]) ||
      "",
  }));
}

export const BudgetProvider = ({ children }) => {
  const { totalDuesAmount } = useDues();
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [income, setIncome] = useState(100000); // Default ₹100,000
  const incomeLoadedRef = useRef(false);

  // Load budgets from localStorage; load income from Firebase (current month) or localStorage
  useEffect(() => {
    const savedBudgets = localStorage.getItem("budgetBudgets");
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    if (firebaseDb) {
      const monthKey = getMonthKey(new Date());
      get(ref(firebaseDb, `${INCOME_REF_KEY}/${monthKey}`)).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data != null && typeof data.value === "number")
            setIncome(data.value);
        } else {
          const savedIncome = localStorage.getItem("budgetIncome");
          if (savedIncome) setIncome(JSON.parse(savedIncome));
        }
        incomeLoadedRef.current = true;
      });
    } else {
      const savedIncome = localStorage.getItem("budgetIncome");
      if (savedIncome) setIncome(JSON.parse(savedIncome));
      incomeLoadedRef.current = true;
    }
  }, []);

  // Subscribe to Firebase expenses (same path as App.tsx)
  useEffect(() => {
    if (!firebaseDb) return;
    const expensesRef = ref(firebaseDb, EXPENSES_REF_KEY);
    const unsub = onValue(expensesRef, (snapshot) => {
      setExpenses(snapshotToExpenses(snapshot));
    });
    return () => unsub();
  }, []);

  // Fallback: when Firebase is not configured, load expenses from localStorage once
  useEffect(() => {
    if (firebaseDb) return;
    const saved = localStorage.getItem("budgetExpenses");
    if (saved) setExpenses(JSON.parse(saved));
  }, []);

  // When Firebase is not configured, persist expenses to localStorage (skip until we've loaded)
  useEffect(() => {
    if (firebaseDb) return;
    if (expenses.length === 0) {
      const cur = localStorage.getItem("budgetExpenses");
      if (cur && cur !== "[]") return; // avoid overwriting before load
    }
    localStorage.setItem("budgetExpenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("budgetBudgets", JSON.stringify(budgets));
  }, [budgets]);

  // Persist income: Firebase (under month key) when configured, else localStorage. Skip Firebase write until initial load so we don't overwrite with default.
  useEffect(() => {
    if (firebaseDb) {
      if (!incomeLoadedRef.current) return;
      const monthKey = getMonthKey(new Date());
      const incomeRef = ref(firebaseDb, `${INCOME_REF_KEY}/${monthKey}`);
      set(incomeRef, { value: income, updatedAt: Date.now() });
    } else {
      localStorage.setItem("budgetIncome", JSON.stringify(income));
    }
  }, [income]);

  const addExpense = (expense) => {
    const payload = {
      ...expense,
      date: expense.date || new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
      type: expense.type ?? "expense",
    };
    if (firebaseDb) {
      const expensesRef = ref(firebaseDb, EXPENSES_REF_KEY);
      push(expensesRef, payload);
    } else {
      const newExpense = { id: Date.now().toString(), ...payload };
      setExpenses((prev) => [...prev, newExpense]);
    }
  };

  const deleteExpense = (id) => {
    if (firebaseDb) {
      const expenseRef = ref(firebaseDb, `${EXPENSES_REF_KEY}/${id}`);
      remove(expenseRef);
    } else {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    }
  };

  const setBudget = (category, amount) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: amount,
    }));
  };

  const updateIncome = (newIncome) => {
    setIncome(newIncome);
  };

  // Calculate totals (expenses + current month dues so total spent includes dues)
  const expensesTotal = expenses
    .filter((expense) => expense.type === "expense")
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalSpent = expensesTotal + (totalDuesAmount ?? 0);

  const totalIncome = expenses
    .filter((expense) => expense.type === "income")
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const balance = income + totalIncome - totalSpent;

  // Persist total income to Realtime DB under month key (totalIncome/YYYY-MM)
  useEffect(() => {
    if (!firebaseDb) return;
    const monthKey = getMonthKey(new Date());
    const totalIncomeRef = ref(
      firebaseDb,
      `${TOTAL_INCOME_REF_KEY}/${monthKey}`
    );
    set(totalIncomeRef, { value: totalIncome, updatedAt: Date.now() });
  }, [totalIncome]);

  // Calculate category-wise spending
  const categorySpending = expenses
    .filter((expense) => expense.type === "expense")
    .reduce((acc, expense) => {
      const category = expense.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {});

  // Check if category is over budget
  const isOverBudget = (category) => {
    const spent = categorySpending[category] || 0;
    const budget = budgets[category] || 0;
    return budget > 0 && spent > budget;
  };

  // Get overspent amount for a category
  const getOverspentAmount = (category) => {
    const spent = categorySpending[category] || 0;
    const budget = budgets[category] || 0;
    return budget > 0 ? Math.max(0, spent - budget) : 0;
  };

  // Calculate 6-month projection for recurring items
  const getSixMonthProjection = (category) => {
    const spent = categorySpending[category] || 0;
    return spent;
  };

  const value = {
    expenses,
    budgets,
    income,
    addExpense,
    deleteExpense,
    setBudget,
    updateIncome,
    totalSpent,
    totalIncome,
    balance,
    categorySpending,
    isOverBudget,
    getOverspentAmount,
    getSixMonthProjection,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};
