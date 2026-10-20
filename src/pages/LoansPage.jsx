import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue, push, update, remove } from "firebase/database";
import { firebaseDb } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import Reveal from "../components/Reveal";
import AnimatedNumber from "../components/AnimatedNumber";
import LoanCard from "../components/loans/LoanCard";
import { NewLoanForm, RepaymentForm, FinishLoanForm } from "../components/loans/LoanForms";
import { Alert, Check, Clock, HandCoins, Inbox, Logout, Plus } from "../components/Icons";
import {
  ACTIVE,
  LOANS_REF_KEY,
  finishPatch,
  formatInr,
  repaymentPatch,
  splitLoans,
} from "../utils/loans";

/**
 * Money lent to people. Lives in its own Firebase branch,
 * `<dataRoot>/loans`, separate from expenses and dues.
 */

const useLoans = () => {
  const { dataRoot } = useAuth();
  const [loans, setLoans] = useState({ active: [], closed: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseDb || !dataRoot) {
      setReady(true);
      return;
    }
    const loansRef = ref(firebaseDb, `${dataRoot}/${LOANS_REF_KEY}`);
    const unsub = onValue(loansRef, (snap) => {
      setLoans(splitLoans(snap.val()));
      setReady(true);
    });
    return () => unsub();
  }, [dataRoot]);

  const loansPath = dataRoot ? `${dataRoot}/${LOANS_REF_KEY}` : null;

  const requireDb = () => {
    if (!firebaseDb || !loansPath) {
      throw new Error("Firebase is not configured, or you are not signed in.");
    }
  };

  const addLoan = async ({ name, amount, note, lentOn }) => {
    requireDb();
    await push(ref(firebaseDb, loansPath), {
      name,
      amount,
      note,
      lentOn,
      status: ACTIVE,
      closedOn: null,
      createdAt: Date.now(),
    });
  };

  // push() with no value only mints a key; the write happens in update().
  const newRepaymentId = (loanId) =>
    push(ref(firebaseDb, `${loansPath}/${loanId}/repayments`)).key;

  const recordRepayment = async (loan, amount, date) => {
    requireDb();
    const patch = repaymentPatch(loan, newRepaymentId(loan.id), amount, date);
    await update(ref(firebaseDb, `${loansPath}/${loan.id}`), patch);
  };

  const finishLoan = async (loan, date) => {
    requireDb();
    const patch = finishPatch(loan, newRepaymentId(loan.id), date);
    await update(ref(firebaseDb, `${loansPath}/${loan.id}`), patch);
  };

  const deleteLoan = async (loan) => {
    requireDb();
    await remove(ref(firebaseDb, `${loansPath}/${loan.id}`));
  };

  return { ...loans, ready, addLoan, recordRepayment, finishLoan, deleteLoan };
};

const LoansHeader = () => {
  const { signOut, authAvailable } = useAuth();
  const today = new Date();
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{
              background: "linear-gradient(140deg,#93f2dd,var(--color-mint) 55%,#14b795)",
              boxShadow: "0 6px 18px -8px rgba(69,224,189,0.6)",
            }}
          >
            <HandCoins className="h-4 w-4" style={{ color: "#002b22" }} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-hi">Loans</p>
            <p className="truncate text-[11px] leading-tight text-low">
              {today.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/" className="btn btn-soft px-3.5 py-2 text-[13px]">
            Dashboard
          </Link>
          {authAvailable && (
            <button onClick={signOut} className="btn-icon" title="Sign out" aria-label="Sign out">
              <Logout className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const Summary = ({ active, onAdd }) => {
  const outstanding = active.reduce((sum, l) => sum + l.remaining, 0);
  const lent = active.reduce((sum, l) => sum + l.amount, 0);
  const paid = lent - outstanding;
  const pct = lent > 0 ? Math.round((paid / lent) * 100) : 0;

  return (
    <section className="card overflow-hidden">
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(69,224,189,0.18), transparent 68%)" }}
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Still owed to you</p>
            <p className="display tnum mt-1 text-[2rem] font-semibold text-hi sm:text-4xl">
              <AnimatedNumber value={outstanding} format={(n) => formatInr(n)} />
            </p>
            <p className="mt-1 text-[12px] text-low">
              {active.length} open {active.length === 1 ? "loan" : "loans"} · {formatInr(paid)} of{" "}
              {formatInr(lent)} back
            </p>
          </div>
          <button type="button" onClick={onAdd} className="btn btn-accent shrink-0 px-3.5 py-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Lend money
          </button>
        </div>
        {lent > 0 && (
          <div className="meter mt-5">
            <div className="meter-fill" style={{ width: `${pct}%`, background: "var(--color-mint)" }} />
          </div>
        )}
      </div>
    </section>
  );
};

const Empty = ({ icon, text }) => (
  <div className="card flex flex-col items-center gap-2 px-5 py-10 text-center">
    <span className="tile text-low">{icon}</span>
    <p className="text-[13px] text-low">{text}</p>
  </div>
);

const LoansPage = () => {
  const { active, closed, ready, addLoan, recordRepayment, finishLoan, deleteLoan } = useLoans();
  // { kind: "new" | "repay" | "finish", loan? }
  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const closeSheet = useCallback(() => setSheet(null), []);

  const run = async (action, okText) => {
    setSaving(true);
    try {
      await action();
      setSheet(null);
      setFlash({ kind: "ok", text: okText });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loan) => {
    if (!window.confirm(`Delete the loan to ${loan.name}? This cannot be undone.`)) return;
    try {
      await deleteLoan(loan);
      setFlash({ kind: "ok", text: "Loan deleted." });
    } catch (err) {
      setFlash({ kind: "err", text: err instanceof Error ? err.message : "Delete failed." });
    }
  };

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3000);
    return () => clearTimeout(t);
  }, [flash]);

  const cardProps = {
    onRepay: (loan) => setSheet({ kind: "repay", loan }),
    onFinish: (loan) => setSheet({ kind: "finish", loan }),
    onDelete: handleDelete,
  };

  return (
    <div className="min-h-dvh pb-20 lg:pb-16">
      <LoansHeader />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
        {!firebaseDb && (
          <p className="flex items-start gap-2 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2 text-[13px] text-amber">
            <Alert className="mt-0.5 h-4 w-4 shrink-0" />
            Firebase is not configured, so loans cannot be saved.
          </p>
        )}

        <Reveal>
          <Summary active={active} onAdd={() => setSheet({ kind: "new" })} />
        </Reveal>

        {flash && (
          <p
            className={`anim-fade flex items-start gap-2 rounded-xl border px-3 py-2 text-[13px] ${
              flash.kind === "ok"
                ? "border-mint/25 bg-mint/10 text-mint"
                : "border-coral/25 bg-coral/10 text-coral"
            }`}
          >
            {flash.kind === "ok" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Alert className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {flash.text}
          </p>
        )}

        <section>
          <h2 className="eyebrow mb-3">Open loans</h2>
          {!ready ? (
            <p className="text-[13px] text-low">Loading…</p>
          ) : active.length === 0 ? (
            <Empty icon={<HandCoins className="h-4 w-4" />} text="Nobody owes you anything right now." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {active.map((loan) => (
                <LoanCard key={loan.id} loan={loan} {...cardProps} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="eyebrow mb-3 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Past loans
          </h2>
          {ready && closed.length === 0 ? (
            <Empty icon={<Inbox className="h-4 w-4" />} text="Finished loans show up here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {closed.map((loan) => (
                <LoanCard key={loan.id} loan={loan} {...cardProps} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={sheet?.kind === "new"}
        onClose={closeSheet}
        title="Lend money"
        subtitle="Keep track of who owes you what."
        icon={<HandCoins className="h-4 w-4" />}
      >
        <NewLoanForm saving={saving} onSubmit={(data) => run(() => addLoan(data), "Loan added.")} />
      </Modal>

      <Modal
        open={sheet?.kind === "repay"}
        onClose={closeSheet}
        title="Paid back some"
        subtitle={sheet?.loan?.name}
        icon={<HandCoins className="h-4 w-4" />}
      >
        {sheet?.kind === "repay" && (
          <RepaymentForm
            loan={sheet.loan}
            saving={saving}
            onSubmit={(amount, date) =>
              run(() => recordRepayment(sheet.loan, amount, date), "Payment recorded.")
            }
          />
        )}
      </Modal>

      <Modal
        open={sheet?.kind === "finish"}
        onClose={closeSheet}
        title="Finish loan"
        subtitle={sheet?.loan?.name}
        icon={<Check className="h-4 w-4" />}
      >
        {sheet?.kind === "finish" && (
          <FinishLoanForm
            loan={sheet.loan}
            saving={saving}
            onSubmit={(date) => run(() => finishLoan(sheet.loan, date), "Loan finished.")}
          />
        )}
      </Modal>
    </div>
  );
};

export default LoansPage;
