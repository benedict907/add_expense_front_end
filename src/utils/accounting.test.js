import { describe, it, expect } from "vitest";
import { normalizeEntry, summarize, EXPENSE, INCOME, CARD_PAYMENT } from "./accounting";

const MONTH = "2026-08";
const day = (n) => `2026-08-${String(n).padStart(2, "0")}`;

const entry = (overrides) =>
  normalizeEntry({ type: EXPENSE, amount: 0, date: day(5), category: "Groceries", ...overrides });

const run = (entries, options = {}) =>
  summarize(entries.map(entry), { income: 100000, monthKey: MONTH, ...options });

describe("a card swipe", () => {
  const swipe = [{ amount: 2000, account: "hdfc" }];

  it("counts as spending", () => {
    expect(run(swipe).totalSpent).toBe(2000);
  });

  it("leaves the bank balance alone", () => {
    expect(run(swipe).bankBalance).toBe(100000);
  });

  it("becomes outstanding on that card", () => {
    const { cardOutstanding, outstandingByCard } = run(swipe);
    expect(cardOutstanding).toBe(2000);
    expect(outstandingByCard).toEqual({ hdfc: 2000 });
  });

  it("reduces what is safe to spend", () => {
    expect(run(swipe).safeToSpend).toBe(98000);
  });
});

describe("a cash spend", () => {
  it("moves the bank balance and safe-to-spend together", () => {
    const { bankBalance, safeToSpend, cardOutstanding } = run([
      { amount: 2000, account: "cash" },
    ]);
    expect(bankBalance).toBe(98000);
    expect(safeToSpend).toBe(98000);
    expect(cardOutstanding).toBe(0);
  });
});

describe("paying a card bill", () => {
  const swipeThenPay = [
    { amount: 2000, account: "hdfc" },
    { amount: 2000, account: "hdfc", type: CARD_PAYMENT, date: day(20) },
  ];

  it("is not counted as new spending", () => {
    // The 2000 was already spent at swipe time. Counting the payment too
    // would report 4000 spent for one 2000 purchase.
    expect(run(swipeThenPay).totalSpent).toBe(2000);
  });

  it("takes the cash out of the bank", () => {
    expect(run(swipeThenPay).bankBalance).toBe(98000);
  });

  it("clears the outstanding", () => {
    expect(run(swipeThenPay).cardOutstanding).toBe(0);
  });

  it("leaves safe-to-spend unchanged from the moment of the swipe", () => {
    expect(run(swipeThenPay).safeToSpend).toBe(98000);
  });

  it("never lands in a category budget", () => {
    expect(run(swipeThenPay).categorySpending).toEqual({ Groceries: 2000 });
  });
});

describe("outstanding across months", () => {
  it("survives the month rolling over", () => {
    // July's swipe is still owed in August; it must not vanish from the
    // outstanding just because it fell out of the current month.
    const { cardOutstanding, totalSpent } = run([
      { amount: 5000, account: "sbi", date: "2026-07-14" },
    ]);
    expect(cardOutstanding).toBe(5000);
    expect(totalSpent).toBe(0); // not spending *this* month
  });
});

describe("income and ordinary dues", () => {
  const rent = { amount: 3000, status: "paid", monthKey: MONTH };

  it("adds extra income to the bank", () => {
    const { grossIncome, bankBalance } = run([{ amount: 5000, type: INCOME }]);
    expect(grossIncome).toBe(105000);
    expect(bankBalance).toBe(105000);
  });

  it("treats a paid due with no card as cash already gone", () => {
    const { totalSpent, bankBalance } = run([], { dues: [rent] });
    expect(totalSpent).toBe(3000);
    expect(bankBalance).toBe(97000);
  });

  it("ignores dues from other months in this month's cash", () => {
    const { totalSpent, bankBalance } = run([], {
      dues: [{ ...rent, monthKey: "2026-07" }],
    });
    expect(totalSpent).toBe(0);
    expect(bankBalance).toBe(100000);
  });
});

describe("a due that settles a card", () => {
  // 2000 swiped on HDFC, with the bill sitting in this month's dues.
  const swipe = [{ amount: 2000, account: "hdfc" }];
  const bill = { amount: 2000, account: "hdfc", monthKey: MONTH };

  it("does not count as spending while pending", () => {
    const { totalSpent, cardOutstanding } = run(swipe, {
      dues: [{ ...bill, status: "pending" }],
    });
    expect(totalSpent).toBe(2000);
    expect(cardOutstanding).toBe(2000);
  });

  it("is not double counted once paid", () => {
    // The old behaviour added every paid due to spending, so this swipe was
    // counted twice: 2000 at the till and 2000 again at the bill.
    const { totalSpent } = run(swipe, { dues: [{ ...bill, status: "paid" }] });
    expect(totalSpent).toBe(2000);
  });

  it("moves the cash and clears the card when paid", () => {
    const { bankBalance, cardOutstanding, safeToSpend } = run(swipe, {
      dues: [{ ...bill, status: "paid" }],
    });
    expect(bankBalance).toBe(98000);
    expect(cardOutstanding).toBe(0);
    expect(safeToSpend).toBe(98000); // unchanged by the act of paying
  });

  it("keeps settling the card in later months", () => {
    // July's swipe, paid off by July's bill, viewed from August. The bill has
    // scrolled out of the current month but the debt it cleared has not.
    const { cardOutstanding, bankBalance } = run(
      [{ amount: 5000, account: "sbi", date: "2026-07-14" }],
      {
        dues: [
          { amount: 5000, account: "sbi", status: "paid", monthKey: "2026-07" },
        ],
      }
    );
    expect(cardOutstanding).toBe(0);
    expect(bankBalance).toBe(100000); // paid in July, not out of August's cash
  });

  it("is left out of the pending-dues ring fence", () => {
    // Outstanding already holds this money back inside safeToSpend; fencing
    // the pending due too would subtract the same bill twice.
    const { pendingSpendDues } = run(swipe, {
      dues: [
        { ...bill, status: "pending" },
        { amount: 9000, status: "pending", monthKey: MONTH }, // rent
      ],
    });
    expect(pendingSpendDues).toBe(9000);
  });
});

describe("normalizeEntry", () => {
  it("reads a legacy card-as-category row as a card spend", () => {
    const row = normalizeEntry({ category: "HDFC", amount: 900, type: EXPENSE });
    expect(row.account).toBe("hdfc");
    expect(row.category).toBe("Miscellaneous");
  });

  it("maps the old ICIC spelling to the ICICI card", () => {
    expect(normalizeEntry({ category: "ICIC" }).account).toBe("icici");
  });

  it("defaults a plain category to cash", () => {
    expect(normalizeEntry({ category: "Groceries" }).account).toBe("cash");
  });

  it("does not override an account that was recorded", () => {
    const row = normalizeEntry({ category: "HDFC", account: "cash" });
    expect(row.account).toBe("cash");
  });

  it("types quick-add rows that were saved without one", () => {
    // These used to be invisible in every total.
    const row = normalizeEntry({ category: "GROCERY", amount: 500, description: "veg" });
    expect(row.type).toBe(EXPENSE);
    expect(row.category).toBe("Groceries");
    expect(row.note).toBe("veg");
  });
});
