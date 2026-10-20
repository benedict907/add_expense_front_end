import React, { useState } from "react";
import MoneyInput, { toNumber } from "../MoneyInput";
import { Alert, Calendar, Note } from "../Icons";
import { formatInr, todayIso } from "../../utils/loans";

const ErrorLine = ({ text }) =>
  text ? (
    <p className="anim-fade flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
      <Alert className="mt-0.5 h-4 w-4 shrink-0" />
      {text}
    </p>
  ) : null;

const DateField = ({ id, label, value, onChange, min }) => (
  <div>
    <label htmlFor={id} className="eyebrow mb-2 flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5" />
      {label}
    </label>
    <input
      id={id}
      type="date"
      value={value}
      min={min}
      max={todayIso()}
      onChange={(e) => onChange(e.target.value)}
      className="field tnum"
    />
  </div>
);

/** New loan: who, how much, when. */
export const NewLoanForm = ({ onSubmit, saving }) => {
  const [name, setName] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [lentOn, setLentOn] = useState(todayIso());
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = toNumber(amountRaw);
    if (!name.trim() || amount <= 0 || !lentOn) {
      setError("Add a name, an amount and the date you lent it.");
      return;
    }
    try {
      await onSubmit({ name: name.trim(), amount, note: note.trim(), lentOn });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the loan.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="loan-name" className="eyebrow mb-2 block">
          Lent to
        </label>
        <input
          id="loan-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Person's name"
          className="field"
          autoFocus
        />
      </div>
      <div>
        <label className="eyebrow mb-2 block">Amount</label>
        <MoneyInput
          value={amountRaw}
          onValueChange={(raw) => {
            setAmountRaw(raw);
            setError("");
          }}
          quickAdjust={[500, 1000, 5000]}
        />
      </div>
      <div>
        <label htmlFor="loan-note" className="eyebrow mb-2 flex items-center gap-1.5">
          <Note className="h-3.5 w-3.5" />
          Note (optional)
        </label>
        <input
          id="loan-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was it for?"
          className="field"
        />
      </div>
      <DateField id="loan-date" label="Date lent" value={lentOn} onChange={setLentOn} />
      <ErrorLine text={error} />
      <button type="submit" disabled={saving} className="btn btn-accent w-full py-3.5 text-[15px]">
        {saving ? "Saving…" : "Save loan"}
      </button>
    </form>
  );
};

/** A partial repayment. */
export const RepaymentForm = ({ loan, onSubmit, saving }) => {
  const [amountRaw, setAmountRaw] = useState("");
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(toNumber(amountRaw), date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the payment.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="well flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px]">
        <span className="text-low">Still owed</span>
        <span className="tnum font-semibold text-hi">{formatInr(loan.remaining)}</span>
      </div>
      <div>
        <label className="eyebrow mb-2 block">Amount paid back</label>
        <MoneyInput
          value={amountRaw}
          onValueChange={(raw) => {
            setAmountRaw(raw);
            setError("");
          }}
          accent="var(--color-mint)"
          autoFocus
        />
      </div>
      <DateField id="repay-date" label="Date received" value={date} onChange={setDate} min={loan.lentOn} />
      <p className="text-[11px] text-low">
        Paying back the full {formatInr(loan.remaining)} finishes the loan.
      </p>
      <ErrorLine text={error} />
      <button type="submit" disabled={saving} className="btn btn-mint w-full py-3.5 text-[15px]">
        {saving ? "Saving…" : "Record payment"}
      </button>
    </form>
  );
};

/** Close a loan; whatever is left is recorded as received on that date. */
export const FinishLoanForm = ({ loan, onSubmit, saving }) => {
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish the loan.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[13px] text-mid">
        {loan.remaining > 0
          ? `This records the remaining ${formatInr(loan.remaining)} as paid back and moves the loan to history.`
          : "This moves the loan to history."}
      </p>
      <DateField id="finish-date" label="Date finished" value={date} onChange={setDate} min={loan.lentOn} />
      <ErrorLine text={error} />
      <button type="submit" disabled={saving} className="btn btn-mint w-full py-3.5 text-[15px]">
        {saving ? "Saving…" : "Finish loan"}
      </button>
    </form>
  );
};
