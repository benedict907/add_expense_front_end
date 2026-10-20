import React, { useState } from "react";
import { Calendar, Check, Trash } from "../Icons";
import { daysBetween, formatDate, formatInr, todayIso } from "../../utils/loans";

const hueFor = (progress) =>
  progress >= 1
    ? "var(--color-mint)"
    : progress >= 0.5
    ? "var(--color-lime)"
    : "var(--color-amber)";

/** Paid-back progress: a bar filled to the share of the loan returned so far. */
export const LoanProgress = ({ loan }) => {
  const pct = Math.round(loan.progress * 100);
  return (
    <div>
      <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="meter-fill"
          style={{ width: `${pct}%`, background: hueFor(loan.progress) }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-low">
        <span className="tnum">
          {formatInr(loan.paid)} paid back · {pct}%
        </span>
        <span className="tnum">{formatInr(loan.remaining)} left</span>
      </div>
    </div>
  );
};

const RepaymentList = ({ repayments }) =>
  repayments.length === 0 ? (
    <p className="text-[12px] text-low">No repayments yet.</p>
  ) : (
    <ul className="space-y-1.5">
      {repayments.map((r) => (
        <li key={r.id} className="flex items-center justify-between text-[12px]">
          <span className="text-mid">{formatDate(r.date)}</span>
          <span className="tnum font-semibold text-mint">+{formatInr(r.amount)}</span>
        </li>
      ))}
    </ul>
  );

const LoanCard = ({ loan, onRepay, onFinish, onDelete }) => {
  const [showRepayments, setShowRepayments] = useState(false);
  const isClosed = loan.status === "closed";
  const days = daysBetween(loan.lentOn, isClosed ? loan.closedOn : todayIso());

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-hi">{loan.name}</p>
          {loan.note && <p className="truncate text-[12px] text-low">{loan.note}</p>}
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <p className="tnum text-[17px] font-semibold text-hi">{formatInr(loan.amount)}</p>
          <button
            type="button"
            onClick={() => onDelete(loan)}
            className="btn-icon -mr-1 -mt-0.5 h-8 w-8 text-low"
            title="Delete loan"
            aria-label={`Delete loan to ${loan.name}`}
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="badge bg-white/5 text-mid">
          <Calendar className="h-3 w-3" />
          Lent {formatDate(loan.lentOn)}
        </span>
        {isClosed ? (
          <span className="badge bg-mint/10 text-mint">
            <Check className="h-3 w-3" />
            Finished {formatDate(loan.closedOn)}
          </span>
        ) : null}
        <span className="badge bg-white/5 text-low">
          {days} {days === 1 ? "day" : "days"}
          {isClosed ? " to repay" : " ago"}
        </span>
      </div>

      <div className="mt-4">
        <LoanProgress loan={loan} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!isClosed && (
          <>
            <button
              type="button"
              onClick={() => onRepay(loan)}
              className="btn btn-soft px-3 py-2 text-[13px]"
            >
              Paid back some
            </button>
            <button
              type="button"
              onClick={() => onFinish(loan)}
              className="btn btn-mint px-3 py-2 text-[13px]"
            >
              <Check className="h-4 w-4" />
              Finish loan
            </button>
          </>
        )}
        {loan.repayments.length > 0 && (
          <button
            type="button"
            onClick={() => setShowRepayments((v) => !v)}
            className="chip ml-auto"
            data-active={showRepayments}
          >
            {loan.repayments.length} repayment{loan.repayments.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {showRepayments && (
        <div className="well anim-fade mt-3 rounded-xl p-3">
          <RepaymentList repayments={loan.repayments} />
        </div>
      )}
    </article>
  );
};

export default LoanCard;
