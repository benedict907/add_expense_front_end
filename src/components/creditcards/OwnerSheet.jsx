import React, { useState } from "react";
import Modal from "../Modal";
import { useCreditCards, currencyExact } from "../../context/CreditCardContext";
import { Check, Plus, Alert } from "../Icons";

/**
 * Owner assignment sheet. One tap per owner — the list can be long, so the
 * chips are large and the sheet closes as soon as the write succeeds.
 */
const OwnerSheet = ({ txn, open, onClose }) => {
  const { owners, setOwner, addOwner } = useCreditCards();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [applyRule, setApplyRule] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  if (!txn) return null;

  const apply = async (ownerId) => {
    setBusy(ownerId || "clear");
    setError("");
    try {
      await setOwner(txn, ownerId, { applyRule: applyRule && Boolean(ownerId) });
      onClose();
    } catch (exc) {
      setError(exc.message || "Could not update the owner");
    } finally {
      setBusy("");
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    setError("");
    try {
      const created = await addOwner(name);
      setNewName("");
      setAdding(false);
      await apply(created.ownerId);
    } catch (exc) {
      setError(exc.message || "Could not add that person");
      setBusy("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Who spent this?"
      subtitle={txn.description}
      icon={<Check className="h-4 w-4" />}
    >
      <p className="tnum mb-4 text-[13px] text-mid">
        {currencyExact(txn.amount)}
        {txn.isEMI && <span className="ml-2 text-violet">EMI</span>}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {owners.map((owner) => {
          const active = txn.ownerId === owner.ownerId;
          const hue = owner.color || "var(--color-mint)";
          return (
            <button
              key={owner.ownerId}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => apply(owner.ownerId)}
              className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]"
              style={{
                color: active ? hue : "var(--color-hi)",
                borderColor: active
                  ? `color-mix(in srgb, ${hue} 45%, transparent)`
                  : "rgba(255,255,255,0.07)",
                background: active
                  ? `color-mix(in srgb, ${hue} 12%, transparent)`
                  : "rgba(0,0,0,0.24)",
              }}
            >
              {busy === owner.ownerId ? "Saving…" : owner.name}
              {active && <Check className="h-3.5 w-3.5" />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/12 px-3 py-3.5 text-[13px] font-semibold text-mid transition-colors hover:text-hi"
        >
          <Plus className="h-3.5 w-3.5" />
          Add person
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="field"
          />
          <button type="submit" className="btn btn-accent shrink-0 px-4">
            Add
          </button>
        </form>
      )}

      <label className="mt-4 flex items-start gap-2.5 rounded-xl bg-black/25 px-3 py-2.5 text-[12px] text-mid">
        <input
          type="checkbox"
          checked={applyRule}
          onChange={(e) => setApplyRule(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-lime)]"
        />
        <span>
          Remember this for {txn.merchant || "this merchant"} on this card, and use it
          for future statements.
        </span>
      </label>

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[12px] text-coral">
          <Alert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {txn.ownerId && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => apply(null)}
          className="btn btn-ghost mt-3 w-full py-2.5 text-[13px]"
        >
          Clear owner
        </button>
      )}
    </Modal>
  );
};

export default OwnerSheet;
