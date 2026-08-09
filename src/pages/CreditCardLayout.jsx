import React from "react";
import { Outlet } from "react-router-dom";
import { CreditCardProvider } from "../context/CreditCardContext";

/**
 * One provider for every credit-card route.
 *
 * Mounting a provider per page meant navigating from the dashboard to a
 * statement rebuilt the state from scratch — losing the selected month, which
 * then snapped back to the newest month with data. Sharing it here keeps the
 * month (and the live Firebase subscriptions) intact across the navigation.
 *
 * Scoped to these routes deliberately: the expenses dashboard should not open
 * credit-card subscriptions it never reads.
 */
const CreditCardLayout = () => (
  <CreditCardProvider>
    <Outlet />
  </CreditCardProvider>
);

export default CreditCardLayout;
