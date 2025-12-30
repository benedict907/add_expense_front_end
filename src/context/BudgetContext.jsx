import React, { createContext, useContext, useState, useEffect } from 'react';

const BudgetContext = createContext();

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

export const BudgetProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [income, setIncome] = useState(100000); // Default ₹100,000

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('budgetExpenses');
    const savedBudgets = localStorage.getItem('budgetBudgets');
    const savedIncome = localStorage.getItem('budgetIncome');

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }
    if (savedIncome) {
      setIncome(JSON.parse(savedIncome));
    }
  }, []);

  // Save to localStorage whenever expenses, budgets, or income changes
  useEffect(() => {
    localStorage.setItem('budgetExpenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budgetBudgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('budgetIncome', JSON.stringify(income));
  }, [income]);

  const addExpense = (expense) => {
    const newExpense = {
      id: Date.now().toString(),
      ...expense,
      date: expense.date || new Date().toISOString().split('T')[0],
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const setBudget = (category, amount) => {
    setBudgets(prev => ({
      ...prev,
      [category]: amount
    }));
  };

  const updateIncome = (newIncome) => {
    setIncome(newIncome);
  };

  // Calculate totals
  const totalSpent = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const totalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const balance = income + totalIncome - totalSpent;

  // Calculate category-wise spending
  const categorySpending = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
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
    return spent * 6;
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
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};
