import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import BudgetDashboard from "../pages/BudgetDashboard";
import App from "../App";
import { useAuth } from "../context/AuthContext";

/**
 * When Firebase Auth is configured, show Login until user signs in.
 * When Firebase is not configured, show the app directly (no auth).
 */
const ProtectedApp = () => {
  const { user, loading, authAvailable } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
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
    </Routes>
  );
};

export default ProtectedApp;
