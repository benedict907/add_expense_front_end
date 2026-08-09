import React, { useState } from "react";
import Modal from "../Modal";
import {
  useCreditCards,
  currency,
  formatMonth,
  needsOwner,
} from "../../context/CreditCardContext";
import { Alert, Check, Layers } from "../Icons";

/**
 * Assign one person to everything at once.
 *
 * The realistic shape of a shared card is "99 of these are Jithin's and one is
 * mine", so the fast path is: sweep the whole card to one person, then correct
 * the exceptions individually. Defaults are conservative — only unassigned
 * spending rows are touched, so a sweep never undoes a choice made by hand.
 */
const BulkOwnerSheet = ({ open, onClose, cardId }) => {
  const { owners, setOwnerBulk, cardsById, selectedMonth, monthTransactions } =
    useCreditCards();

  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [applyRule, setApplyRule] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const scope = cardId ? cardsById[cardId]?.cardName || cardId : "all cards";

  // Mirror the server's own filter so the count shown matches what happens.
  const affected = monthTransactions.filter((txn) => {
    if (cardId && txn.cardId !== cardId) return false;
    if (!needsOwner(txn)) return false;
    if (onlyUnassigned && txn.ownerId) return false;
    return true;
  });
  const affectedTotal = affected.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const apply = async (ownerId) => {
    setBusy(ownerId);
    setError("");
    try {
      const result = await setOwnerBulk({
        ownerId,
        cardIds: cardId ? [cardId] : undefined,
        onlyUnassigned,
        applyRule,
      });
      setDone(result);
    } catch (exc) {
      setError(exc.message || "Could not assign");
    } finally {
      setBusy("");
    }
  };

  const close = () => {
    setDone(null);
    setError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Assign everything to one person"
      subtitle={`${scope} · ${formatMonth(selectedMonth)}`}
      icon={<Layers className="h-4 w-4" />}
    >
      {done ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-xl border border-mint/25 bg-mint/10 px-3 py-2.5 text-[13px] text-mint">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            {done.updated} transaction{done.updated === 1 ? "" : "s"} assigned to{" "}
            {done.ownerName}
            {done.skipped > 0 && ` · ${done.skipped} left untouched`}
            {done.rulesWritten > 0 && ` · ${done.rulesWritten} merchants remembered`}
          </p>
          <button type="button" onClick={close} className="btn btn-soft w-full py-3">
            Done
          </button>
        </div>
      ) : (
        <>
          <p className="tnum mb-4 text-[13px] text-mid">
            {affected.length} transaction{affected.length === 1 ? "" : "s"} ·{" "}
            {currency(affectedTotal)}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {owners.map((owner) => {
              const hue = owner.color || "var(--color-mint)";
              return (
                <button
                  key={owner.ownerId}
                  type="button"
                  disabled={Boolean(busy) || affected.length === 0}
                  onClick={() => apply(owner.ownerId)}
                  className="rounded-2xl border px-3 py-3.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40"
                  style={{
                    color: hue,
                    borderColor: `color-mix(in srgb, ${hue} 32%, transparent)`,
                    background: `color-mix(in srgb, ${hue} 10%, transparent)`,
                  }}
                >
                  {busy === owner.ownerId ? "Assigning…" : `All to ${owner.name}`}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-2.5 rounded-xl bg-black/25 px-3 py-2.5 text-[12px] text-mid">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-lime)]"
              />
              <span>
                Only rows with no owner yet. Uncheck to overwrite owners already
                set — including ones you picked by hand.
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl bg-black/25 px-3 py-2.5 text-[12px] text-mid">
              <input
                type="checkbox"
                checked={applyRule}
                onChange={(e) => setApplyRule(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-lime)]"
              />
              <span>Remember these merchants for future statements.</span>
            </label>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-low">
            Payments, refunds and cashback are never assigned — they are not
            anyone&apos;s spending.
          </p>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[12px] text-coral">
              <Alert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
};

export default BulkOwnerSheet;
