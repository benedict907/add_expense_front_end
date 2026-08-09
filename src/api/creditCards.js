import { firebaseAuth } from "../firebase";

/**
 * Thin client for the credit-card endpoints on the FastAPI backend.
 *
 * Auth is the signed-in user's Firebase ID token, verified server-side. No
 * shared secret, Gmail token or PDF password ever reaches the browser.
 */

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function authHeaders() {
  const user = firebaseAuth?.currentUser;
  if (!user) throw new Error("You are not signed in.");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function request(path, { method = "GET", body } = {}) {
  if (!BASE) {
    throw new Error(
      "VITE_API_URL is not set — the dashboard cannot reach the sync backend."
    );
  }
  const response = await fetch(`${BASE}/credit-cards${path}`, {
    method,
    headers: await authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    throw new Error(data?.detail || `Request failed (${response.status})`);
  }
  return data;
}

export const getConfig = () => request("/config");

export const syncStatements = ({ month, cardIds, force = false } = {}) =>
  request("/sync", { method: "POST", body: { month, cardIds, force } });

export const previewCard = (cardId, month) =>
  request(`/preview?cardId=${encodeURIComponent(cardId)}${month ? `&month=${month}` : ""}`);

export const assignOwner = (statementId, transactionId, { ownerId, applyRule = true, ruleScope = "card" }) =>
  request(
    `/transactions/${encodeURIComponent(statementId)}/${encodeURIComponent(transactionId)}/owner`,
    { method: "PATCH", body: { ownerId, applyRule, ruleScope } }
  );

/** Assign one person across a whole month, optionally limited to some cards. */
export const assignOwnerBulk = ({
  ownerId,
  month,
  cardIds,
  onlyUnassigned = true,
  spendOnly = true,
  applyRule = true,
}) =>
  request("/transactions/bulk-owner", {
    method: "PATCH",
    body: { ownerId, month, cardIds, onlyUnassigned, spendOnly, applyRule },
  });

export const createOwner = (name, color) =>
  request("/owners", { method: "POST", body: { name, color } });
