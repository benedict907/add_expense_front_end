/**
 * Categories answer "what did I buy". Accounts answer "what paid for it".
 * Keeping them apart is what lets a card swipe count as spending without
 * pretending money left the bank — see src/utils/accounting.js.
 */
export const CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Transport",
  "Bills & Utilities",
  "Shopping",
  "Health",
  "Entertainment",
  "Miscellaneous",
];

/**
 * Where the money comes from.
 *
 * `kind: "cash"` moves your bank balance the moment you spend. `kind: "card"`
 * does not — it adds to that card's outstanding, and your balance only moves
 * later, when you record the bill payment.
 */
export const ACCOUNTS = [
  { id: "cash", label: "Cash / Bank", short: "Bank", kind: "cash", hue: "var(--color-mint)" },
  { id: "hdfc", label: "HDFC Card", short: "HDFC", kind: "card", hue: "var(--color-iris)" },
  { id: "sbi", label: "SBI Card", short: "SBI", kind: "card", hue: "var(--color-violet)" },
  { id: "icici", label: "ICICI Card", short: "ICICI", kind: "card", hue: "var(--color-amber)" },
  { id: "kotak", label: "Kotak Card", short: "Kotak", kind: "card", hue: "var(--color-coral)" },
];

export const DEFAULT_ACCOUNT = "cash";

export const CARD_ACCOUNTS = ACCOUNTS.filter((account) => account.kind === "card");

const ACCOUNTS_BY_ID = Object.fromEntries(ACCOUNTS.map((account) => [account.id, account]));

export const accountById = (id) => ACCOUNTS_BY_ID[id] ?? ACCOUNTS_BY_ID[DEFAULT_ACCOUNT];

export const isCardAccount = (id) => accountById(id).kind === "card";

/**
 * Entries written before payment method was a field used the bank or card name
 * as the category — including the quick-add screen, which had its own list.
 * Read those as "paid with <card>" so old months keep their meaning instead of
 * silently becoming cash spends.
 */
export const LEGACY_CATEGORY_ACCOUNTS = {
  hdfc: "hdfc",
  sbi: "sbi",
  icic: "icici",
  icici: "icici",
  kotak: "kotak",
};

/** Old quick-add spellings that really were categories. */
export const LEGACY_CATEGORY_NAMES = {
  grocery: "Groceries",
  grocerys: "Groceries",
  groceries: "Groceries",
  misc: "Miscellaneous",
  miscellaneous: "Miscellaneous",
};
