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
 *
 * That rule has to hold whichever door the payment comes through. A due that
 * names a card is the same transfer wearing a reminder's clothes, so it
 * settles outstanding instead of adding to spending. A due that names nothing
 * is an ordinary bill — rent, a SIP — and counts as spending when paid.
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

/** A due that settles a card bill rather than being spending of its own. */
export const settlesCard = (due) => isCardAccount(due.account);

/** Which month a due belongs to — its storage bucket, or failing that its date. */
const dueMonth = (due) => due.monthKey ?? monthKeyOf(due.dueDate);

/**
 * Every figure the dashboard shows, derived from normalized entries.
 *
 * `dues` is the whole dues list across months, not just this one: a bill paid
 * in September settles August's swipes, and that has to keep counting when you
 * are looking at October. Only the cash side of a due is month-scoped.
 */
export function summarize(entries, { income = 0, dues = [], monthKey } = {}) {
  const month = monthKey ?? monthKeyOf(new Date());
  const monthEntries = entries.filter((entry) => monthKeyOf(entry.date) === month);

  const paidDues = dues.filter((due) => due.status === "paid");
  // Card dues are transfers; everything else is real spending.
  const paidCardDues = paidDues.filter(settlesCard);
  const paidSpendDues = sum(
    paidDues.filter((due) => !settlesCard(due) && dueMonth(due) === month)
  );
  const paidCardDuesThisMonth = sum(
    paidCardDues.filter((due) => dueMonth(due) === month)
  );
  // Unpaid dues are money already claimed, but a pending *card* due is money
  // the outstanding is already holding back — ring-fencing it twice would
  // shrink the daily allowance for one bill counted two ways.
  const pendingSpendDues = sum(
    dues.filter(
      (due) =>
        due.status !== "paid" && !settlesCard(due) && dueMonth(due) === month
    )
  );

  const monthExpenses = monthEntries.filter((entry) => entry.type === EXPENSE);
  const onCards = monthExpenses.filter((entry) => isCardAccount(entry.account));
  const inCash = monthExpenses.filter((entry) => !isCardAccount(entry.account));

  const spentOnCards = sum(onCards);
  const spentInCash = sum(inCash);
  // Spending, all payment methods. Card bill payments are deliberately absent,
  // whether they were logged as entries or ticked off as dues.
  const totalSpent = spentInCash + spentOnCards + paidSpendDues;

  const extraIncome = sum(monthEntries.filter((entry) => entry.type === INCOME));
  const grossIncome = income + extraIncome;

  // Cash out this month: what you bought with cash, the ordinary bills you
  // settled, and every card bill you paid — by either route.
  const billsPaid =
    sum(monthEntries.filter((entry) => entry.type === CARD_PAYMENT)) +
    paidCardDuesThisMonth;
  const bankBalance = grossIncome - spentInCash - paidSpendDues - billsPaid;

  // Outstanding runs over every entry ever, not just this month: an unpaid
  // October bill does not stop existing because the calendar turned over.
  const outstandingByCard = {};
  const settle = (account, delta) => {
    outstandingByCard[account] = (outstandingByCard[account] || 0) + delta;
  };
  entries.forEach((entry) => {
    if (!isCardAccount(entry.account)) return;
    const direction =
      entry.type === EXPENSE ? 1 : entry.type === CARD_PAYMENT ? -1 : 0;
    if (direction === 0) return;
    settle(entry.account, direction * amountOf(entry));
  });
  paidCardDues.forEach((due) => settle(due.account, -amountOf(due)));

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
    paidSpendDues,
    pendingSpendDues,
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
