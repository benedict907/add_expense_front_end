import {
  DEFAULT_ACCOUNT,
  LEGACY_CATEGORY_ACCOUNTS,
  LEGACY_CATEGORY_NAMES,
  isCardAccount,
} from "../constants";

/**
 * The money model.
 *
 * A card swipe is two facts, not one: you spent the money (permanently, out of
 * your net worth) and your bank balance did not move (you took on debt to the
 * card issuer instead). One number cannot hold both, so we keep three:
 *
 *   totalSpent      every rupee spent this month, whatever paid for it.
 *                   This is what category budgets measure against.
 *   bankBalance     cash actually available. Card swipes never touch it;
 *                   card bill payments do, on the day you pay them.
 *   cardOutstanding card spending not yet settled by a bill payment.
 *
 *   safeToSpend = bankBalance − cardOutstanding
 *
 * The rule that keeps this honest: paying a card bill is a *transfer*, not an
 * expense. It moves cash and clears debt, but it is not new spending — the
 * spending was counted at swipe time. Counting it again would double every
 * rupee that ever touched a card.
 */

export const EXPENSE = "expense";
export const INCOME = "income";
export const CARD_PAYMENT = "cardPayment";

export function monthKeyOf(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const amountOf = (entry) => Number(entry.amount) || 0;

const sum = (entries) => entries.reduce((total, entry) => total + amountOf(entry), 0);

/**
 * Fill in what older records never stored, at read time.
 *
 * Nothing is rewritten in Firebase: the raw rows stay as they were written, and
 * every screen reads them through here. An entry with no `account` that was
 * filed under a card name is treated as having been paid with that card.
 */
export function normalizeEntry(row) {
  const rawCategory = (row.category ?? "").trim();
  const key = rawCategory.toLowerCase();
  const legacyAccount = LEGACY_CATEGORY_ACCOUNTS[key];

  const account = row.account ?? legacyAccount ?? DEFAULT_ACCOUNT;
  const category = legacyAccount
    ? "Miscellaneous" // the "category" was only ever the card name
    : LEGACY_CATEGORY_NAMES[key] ?? rawCategory;

  return {
    ...row,
    account,
    category,
    // Quick-add wrote `description`; the dashboard form writes `note`.
    note: row.note ?? row.description ?? "",
    // Quick-add wrote no type at all, which used to drop those rows out of
    // every total. An untyped entry is a spend.
    type: row.type ?? EXPENSE,
    date:
      row.date ||
      (row.createdAt && new Date(row.createdAt).toISOString().split("T")[0]) ||
      "",
  };
}

/**
 * Every figure the dashboard shows, derived from normalized entries.
 *
 * `paidDues` comes from the dues module and is treated as cash already gone.
 */
export function summarize(entries, { income = 0, paidDues = 0, monthKey } = {}) {
  const month = monthKey ?? monthKeyOf(new Date());
  const monthEntries = entries.filter((entry) => monthKeyOf(entry.date) === month);

  const monthExpenses = monthEntries.filter((entry) => entry.type === EXPENSE);
  const onCards = monthExpenses.filter((entry) => isCardAccount(entry.account));
  const inCash = monthExpenses.filter((entry) => !isCardAccount(entry.account));

  const spentOnCards = sum(onCards);
  const spentInCash = sum(inCash);
  // Spending, all payment methods. Card bill payments are deliberately absent.
  const totalSpent = spentInCash + spentOnCards + paidDues;

  const extraIncome = sum(monthEntries.filter((entry) => entry.type === INCOME));
  const grossIncome = income + extraIncome;

  const billsPaid = sum(monthEntries.filter((entry) => entry.type === CARD_PAYMENT));
  const bankBalance = grossIncome - spentInCash - paidDues - billsPaid;

  // Outstanding runs over every entry ever, not just this month: an unpaid
  // October bill does not stop existing because the calendar turned over.
  const outstandingByCard = {};
  entries.forEach((entry) => {
    if (!isCardAccount(entry.account)) return;
    const direction =
      entry.type === EXPENSE ? 1 : entry.type === CARD_PAYMENT ? -1 : 0;
    if (direction === 0) return;
    outstandingByCard[entry.account] =
      (outstandingByCard[entry.account] || 0) + direction * amountOf(entry);
  });

  const cardOutstanding = Object.values(outstandingByCard).reduce(
    (total, value) => total + value,
    0
  );

  const categorySpending = monthExpenses.reduce((acc, entry) => {
    const category = entry.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + amountOf(entry);
    return acc;
  }, {});

  return {
    monthEntries,
    totalSpent,
    spentInCash,
    spentOnCards,
    extraIncome,
    grossIncome,
    billsPaid,
    bankBalance,
    outstandingByCard,
    cardOutstanding,
    safeToSpend: bankBalance - cardOutstanding,
    categorySpending,
  };
}
