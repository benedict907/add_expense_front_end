import { describe, it, expect } from "vitest";
import {
  normalizeLoan,
  splitLoans,
  repaymentPatch,
  finishPatch,
  daysBetween,
  CLOSED,
} from "./loans";

const loan = (overrides = {}) =>
  normalizeLoan("l1", { name: "Asha", amount: 1000, lentOn: "2026-10-01", ...overrides });

describe("a loan", () => {
  it("is fully owed with no repayments", () => {
    const l = loan();
    expect(l.paid).toBe(0);
    expect(l.remaining).toBe(1000);
    expect(l.progress).toBe(0);
  });

  it("is half way after half is paid back", () => {
    const l = loan({ repayments: { r1: { amount: 300, date: "2026-10-05" }, r2: { amount: 200, date: "2026-10-09" } } });
    expect(l.paid).toBe(500);
    expect(l.remaining).toBe(500);
    expect(l.progress).toBe(0.5);
    expect(l.repayments.map((r) => r.id)).toEqual(["r2", "r1"]);
  });
});

describe("splitLoans", () => {
  it("separates active from closed", () => {
    const { active, closed } = splitLoans({
      a: { name: "A", amount: 10, lentOn: "2026-01-01" },
      b: { name: "B", amount: 10, lentOn: "2026-02-01", status: "closed", closedOn: "2026-03-01" },
      junk: null,
    });
    expect(active.map((l) => l.id)).toEqual(["a"]);
    expect(closed.map((l) => l.id)).toEqual(["b"]);
  });
});

describe("repaymentPatch", () => {
  it("records a partial repayment and keeps the loan open", () => {
    const patch = repaymentPatch(loan(), "r1", 400, "2026-10-10");
    expect(patch["repayments/r1"].amount).toBe(400);
    expect(patch.status).toBeUndefined();
  });

  it("closes the loan when the last of it is paid", () => {
    const patch = repaymentPatch(loan(), "r1", 1000, "2026-10-10");
    expect(patch.status).toBe(CLOSED);
    expect(patch.closedOn).toBe("2026-10-10");
  });

  it("rejects more than what is owed, and zero", () => {
    expect(() => repaymentPatch(loan(), "r1", 1001, "2026-10-10")).toThrow();
    expect(() => repaymentPatch(loan(), "r1", 0, "2026-10-10")).toThrow();
  });
});

describe("finishPatch", () => {
  it("records the remainder and closes", () => {
    const l = loan({ repayments: { r1: { amount: 250, date: "2026-10-05" } } });
    const patch = finishPatch(l, "r2", "2026-10-20");
    expect(patch["repayments/r2"].amount).toBe(750);
    expect(patch.status).toBe(CLOSED);
    expect(patch.closedOn).toBe("2026-10-20");
  });
});

it("counts days between dates", () => {
  expect(daysBetween("2026-10-01", "2026-10-20")).toBe(19);
});
