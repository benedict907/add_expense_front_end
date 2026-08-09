import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import BudgetDashboard from "../pages/BudgetDashboard";
import CreditCardDashboard from "../pages/CreditCardDashboard";
import CardStatement from "../pages/CardStatement";
import CreditCardLayout from "../pages/CreditCardLayout";
import App from "../App";
import Loader from "../Loader";
import { useAuth } from "../context/AuthContext";

/**
 * When Firebase Auth is configured, show Login until user signs in.
 * When Firebase is not configured, show the app directly (no auth).
 */
const ProtectedApp = () => {
  const { user, loading, authAvailable } = useAuth();

  if (loading) {
    return <Loader label="Opening your vault" />;
  }

  // If Firebase Auth is configured but user not logged in, show login
  if (authAvailable && !user) {
    return <Login />;
  }

  // Otherwise show the app (either no auth required, or user is logged in)
  return (
    <Routes>
      <Route path="/" element={<BudgetDashboard />} />
      <Route path="/add" element={<App />} />
      {/* Credit-card module — separate data, separate pages, one shared
          provider so the selected month survives navigation between them. */}
      <Route element={<CreditCardLayout />}>
        <Route path="/credit-cards" element={<CreditCardDashboard />} />
        <Route path="/credit-cards/:cardId" element={<CardStatement />} />
      </Route>
    </Routes>
  );
};

export default ProtectedApp;
