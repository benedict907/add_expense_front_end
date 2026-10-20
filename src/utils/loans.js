/**
 * Money you have lent people.
 *
 * Firebase layout:
 *   <dataRoot>/loans/<loanId> = {
 *     name, amount, note, lentOn: "YYYY-MM-DD",
 *     status: "active" | "closed", closedOn: "YYYY-MM-DD" | null,
 *     repayments: { <pushId>: { amount, date: "YYYY-MM-DD", createdAt } },
 *     createdAt,
 *   }
 *
 * `amount` is what was lent and never changes; what is still owed is derived
 * from the repayments so the history of partial paybacks is kept.
 */

export const LOANS_REF_KEY = "loans";

export const ACTIVE = "active";
export const CLOSED = "closed";

/** Today as YYYY-MM-DD in the local timezone (toISOString would use UTC). */
export const todayIso = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const round2 = (n) => Math.round(n * 100) / 100;

export function normalizeLoan(id, row = {}) {
  const repayments = Object.entries(row.repayments || {})
    .filter(([, r]) => r && typeof r === "object")
    .map(([repaymentId, r]) => ({
      id: repaymentId,
      amount: Number(r.amount) || 0,
      date: r.date ?? "",
      createdAt: r.createdAt ?? 0,
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  const amount = Number(row.amount) || 0;
  const paid = round2(repayments.reduce((sum, r) => sum + r.amount, 0));
  const remaining = Math.max(0, round2(amount - paid));
  const progress = amount > 0 ? Math.min(1, paid / amount) : 0;

  return {
    id,
    name: row.name ?? "",
    note: row.note ?? "",
    amount,
    lentOn: row.lentOn ?? "",
    status: row.status === CLOSED ? CLOSED : ACTIVE,
    closedOn: row.closedOn ?? "",
    createdAt: row.createdAt ?? 0,
    repayments,
    paid,
    remaining,
    progress,
  };
}

/** Firebase snapshot value -> { active, closed }, newest first in each list. */
export function splitLoans(data) {
  const loans = Object.entries(data || {})
    .filter(([, row]) => row && typeof row === "object")
    .map(([id, row]) => normalizeLoan(id, row));

  const active = loans
    .filter((l) => l.status === ACTIVE)
    .sort((a, b) => b.lentOn.localeCompare(a.lentOn) || b.createdAt - a.createdAt);
  const closed = loans
    .filter((l) => l.status === CLOSED)
    .sort((a, b) => b.closedOn.localeCompare(a.closedOn) || b.createdAt - a.createdAt);

  return { active, closed };
}

/**
 * The patch to apply to a loan node when `amount` is paid back on `date`.
 * Closes the loan once nothing is left. Throws on an invalid amount so the UI
 * can show the message as-is.
 */
export function repaymentPatch(loan, repaymentId, amount, date) {
  const value = round2(Number(amount) || 0);
  if (value <= 0) throw new Error("Enter an amount greater than zero.");
  if (value > loan.remaining) {
    throw new Error(`Only ${formatInr(loan.remaining)} is still owed.`);
  }
  const patch = {
    [`repayments/${repaymentId}`]: { amount: value, date, createdAt: Date.now() },
  };
  if (round2(loan.remaining - value) === 0) {
    patch.status = CLOSED;
    patch.closedOn = date;
  }
  return patch;
}

/** Finishing a loan records whatever is left as the final repayment. */
export function finishPatch(loan, repaymentId, date) {
  const patch = { status: CLOSED, closedOn: date };
  if (loan.remaining > 0) {
    patch[`repayments/${repaymentId}`] = {
      amount: loan.remaining,
      date,
      createdAt: Date.now(),
    };
  }
  return patch;
}

export const formatInr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

export const formatDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Whole days between two YYYY-MM-DD dates. */
export const daysBetween = (fromIso, toIso) => {
  if (!fromIso || !toIso) return 0;
  const toDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.max(0, Math.round((toDate(toIso) - toDate(fromIso)) / 86400000));
};
