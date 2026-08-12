export type AccountKind = "cash" | "card";

export type Account = {
  id: string;
  label: string;
  short: string;
  kind: AccountKind;
  /** CSS colour used for chips and badges. */
  hue: string;
};

export const CATEGORIES: string[];
export const ACCOUNTS: Account[];
export const CARD_ACCOUNTS: Account[];
export const DEFAULT_ACCOUNT: string;

export function accountById(id: string | undefined): Account;
export function isCardAccount(id: string | undefined): boolean;

export const LEGACY_CATEGORY_ACCOUNTS: Record<string, string>;
export const LEGACY_CATEGORY_NAMES: Record<string, string>;
