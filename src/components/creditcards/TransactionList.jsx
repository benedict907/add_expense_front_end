import React, { useMemo, useState } from "react";
import {
  useCreditCards,
  currencyExact,
  TYPE_LABELS,
  needsOwner,
  ownerAmount,
  UNASSIGNED,
} from "../../context/CreditCardContext";
import OwnerSheet from "./OwnerSheet";
import BulkOwnerSheet from "./BulkOwnerSheet";
import { Alert, Pencil, Layers } from "../Icons";

/**
 * Transactions for the selected month, with filters.
 *
 * Desktop gets a table; below `md` the same rows render as cards, because a
 * seven-column table is unusable on a phone. One dataset, two layouts — no
 * horizontal scrolling either way.
 */

const TYPE_ORDER = [
  "PURCHASE",
  "EMI",
  "REFUND",
  "PAYMENT",
  "FEE",
  "INTEREST",
  "CREDIT",
  "OTHER",
];

const TYPE_HUE = {
  PURCHASE: "var(--color-iris)",
  EMI: "var(--color-violet)",
  REFUND: "var(--color-mint)",
  PAYMENT: "var(--color-mint)",
  FEE: "var(--color-amber)",
  INTEREST: "var(--color-amber)",
  CREDIT: "var(--color-mint)",
  OTHER: "var(--color-mid)",
};

const shortDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const OwnerCell = ({ txn, onEdit }) => {
  // Payments and cashback belong to the card, not to a person. Showing them as
  // "Owner required" would pad the review queue with rows nobody can action.
  if (!txn.ownerId && !needsOwner(txn)) {
    return (
      <button
        type="button"
        onClick={() => onEdit(txn)}
        className="text-[12px] text-low transition-colors hover:text-mid"
        title="Not attributed to a person — assign one anyway if you want"
      >
        —
      </button>
    );
  }

  if (!txn.ownerId) {
    return (
      <button
        type="button"
        onClick={() => onEdit(txn)}
        className="badge border border-amber/35 bg-amber/12 px-2.5 py-1 text-amber"
      >
        <Alert className="h-3 w-3" />
        Owner required
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onEdit(txn)}
      className="badge border border-white/8 bg-white/5 px-2.5 py-1 text-hi"
      title={`Set from ${txn.ownerSource?.toLowerCase().replace(/_/g, " ")}`}
    >
      {txn.ownerName || "—"}
      <Pencil className="h-3 w-3 text-low" />
    </button>
  );
};

const TransactionList = ({ ownerFilter, onOwnerFilterChange, cardFilter, showCardColumn = true }) => {
  const { monthTransactions, cards, owners, cardsById } = useCreditCards();
  const cardLabel = (cardId) => cardsById[cardId]?.cardName || cardId;

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [emiOnly, setEmiOnly] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [localCard, setLocalCard] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const activeCard = cardFilter ?? (localCard === "ALL" ? null : localCard);

  // "Unassigned" means a row that wants an owner and hasn't got one. A payment
  // has no owner by design, so it is never unassigned — it would otherwise be
  // the only thing left when you filter for work to do.
  const isUnassigned = (txn) => needsOwner(txn) && !txn.ownerId;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return monthTransactions
      .filter((txn) => {
        if (activeCard && txn.cardId !== activeCard) return false;
        if (typeFilter !== "ALL" && txn.transactionType !== typeFilter) return false;
        if (emiOnly && !txn.isEMI) return false;
        if (unassignedOnly && !isUnassigned(txn)) return false;
        if (ownerFilter === UNASSIGNED && !isUnassigned(txn)) return false;
        if (ownerFilter && ownerFilter !== UNASSIGNED && txn.ownerId !== ownerFilter) {
          return false;
        }
        if (term && !`${txn.description} ${txn.merchant}`.toLowerCase().includes(term)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""));
  }, [monthTransactions, activeCard, typeFilter, emiOnly, unassignedOnly, ownerFilter, search]);

  // Counted within the card being viewed, so a statement page never advertises
  // work that belongs to a different card.
  const unassignedCount = monthTransactions.filter(
    (t) => (!activeCard || t.cardId === activeCard) && isUnassigned(t)
  ).length;
  const shownTotal = rows
    .filter(needsOwner)
    .reduce((sum, t) => sum + ownerAmount(t), 0);

  const typesPresent = useMemo(() => {
    const present = new Set(monthTransactions.map((t) => t.transactionType));
    return TYPE_ORDER.filter((type) => present.has(type));
  }, [monthTransactions]);

  return (
    <section className="card card-hover overflow-hidden">
      {/* ---------- filter bar ----------
          Not sticky. On a phone it stacks to ~158px — nearly a third of the
          screen — and a pinned element paints over the list beneath it, so the
          top transactions were permanently hidden. It sits at the head of the
          list instead, where it can't cover anything. */}
      <div className="px-4 py-3 sm:px-6 sm:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="eyebrow">Transactions</p>
            <p className="tnum mt-0.5 text-[11px] text-low">
              {rows.length} shown · {currencyExact(shownTotal)} spend
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unassignedCount > 0 && (
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="chip"
                title="Assign one person to everything shown"
              >
                <Layers className="h-3.5 w-3.5" />
                Assign all
              </button>
            )}

            {unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => setUnassignedOnly((v) => !v)}
              data-active={unassignedOnly}
              className="chip border-amber/35 bg-amber/12 text-amber data-[active=true]:border-amber data-[active=true]:bg-amber/20 data-[active=true]:text-amber"
            >
              <Alert className="h-3.5 w-3.5" />
              {unassignedOnly ? "Showing" : "Show"} unassigned ({unassignedCount})
            </button>
            )}
          </div>
        </div>

        {/* Wraps onto as many rows as it needs. The previous horizontal
            scroller squeezed the search box and hid the type filter off-screen
            on a phone. */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant"
            className="field h-10 w-full py-0 text-[13px] sm:h-9 sm:w-auto sm:min-w-[9rem] sm:flex-1"
          />

          {!cardFilter && cards.length > 1 && (
            <select
              value={localCard}
              onChange={(e) => setLocalCard(e.target.value)}
              className="field h-10 min-w-0 flex-1 py-0 text-[13px] sm:h-9 sm:w-auto sm:flex-none sm:shrink-0"
              aria-label="Filter by card"
            >
              <option value="ALL">All cards</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.cardName}
                </option>
              ))}
            </select>
          )}

          <select
            value={ownerFilter || "ALL"}
            onChange={(e) =>
              onOwnerFilterChange(e.target.value === "ALL" ? null : e.target.value)
            }
            className="field h-10 min-w-0 flex-1 py-0 text-[13px] sm:h-9 sm:w-auto sm:flex-none sm:shrink-0"
            aria-label="Filter by person"
          >
            <option value="ALL">Everyone</option>
            {owners.map((owner) => (
              <option key={owner.ownerId} value={owner.ownerId}>
                {owner.name}
              </option>
            ))}
            <option value={UNASSIGNED}>Unassigned</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="field h-10 min-w-0 flex-1 py-0 text-[13px] sm:h-9 sm:w-auto sm:flex-none sm:shrink-0"
            aria-label="Filter by type"
          >
            <option value="ALL">All types</option>
            {typesPresent.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEmiOnly((v) => !v)}
            data-active={emiOnly}
            className="chip h-10 shrink-0 px-3.5 sm:h-auto sm:px-2.5"
          >
            <Layers className="h-3.5 w-3.5" />
            EMI only
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[13px] text-low sm:px-6">
          No transactions match these filters.
        </p>
      ) : (
        <>
          {/* ---------- mobile: cards ---------- */}
          <ul className="space-y-2 px-4 pb-4 pt-3 md:hidden">
            {rows.map((txn) => (
              <li key={txn.transactionId} className="well p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-hi">
                      {txn.description}
                    </p>
                    <p className="tnum mt-0.5 text-[11px] text-low">
                      {shortDate(txn.transactionDate)}
                      {showCardColumn && ` · ${cardLabel(txn.cardId)}`}
                    </p>
                  </div>
                  <p className="tnum shrink-0 text-[14px] font-medium text-hi">
                    {currencyExact(txn.amount)}
                  </p>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className="badge"
                    style={{
                      color: TYPE_HUE[txn.transactionType],
                      background: `color-mix(in srgb, ${TYPE_HUE[txn.transactionType]} 13%, transparent)`,
                    }}
                  >
                    {TYPE_LABELS[txn.transactionType] || txn.transactionType}
                  </span>
                  {txn.isEMI && (
                    <span className="badge bg-violet/12 text-violet">
                      EMI
                      {txn.emiNumber && txn.emiTenure
                        ? ` ${txn.emiNumber}/${txn.emiTenure}`
                        : ""}
                    </span>
                  )}
                  <span className="ml-auto">
                    <OwnerCell txn={txn} onEdit={setEditing} />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* ---------- desktop: table ---------- */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/6 text-left">
                  {["Date", "Description", "Amount", "Type", "EMI", "Owner"].map((head) => (
                    <th
                      key={head}
                      className="eyebrow px-3 py-2.5 font-semibold first:pl-6 last:pr-6"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((txn) => (
                  <tr
                    key={txn.transactionId}
                    className="border-b border-white/4 transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="tnum whitespace-nowrap px-3 py-2.5 pl-6 text-mid">
                      {shortDate(txn.transactionDate)}
                    </td>
                    <td className="max-w-[22rem] px-3 py-2.5">
                      <p className="truncate text-hi" title={txn.rawDescription}>
                        {txn.description}
                      </p>
                      {showCardColumn && (
                        <p className="truncate text-[11px] text-low">
                          {cardLabel(txn.cardId)}
                        </p>
                      )}
                    </td>
                    <td className="tnum whitespace-nowrap px-3 py-2.5 font-medium text-hi">
                      {currencyExact(txn.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="badge"
                        style={{
                          color: TYPE_HUE[txn.transactionType],
                          background: `color-mix(in srgb, ${TYPE_HUE[txn.transactionType]} 13%, transparent)`,
                        }}
                      >
                        {TYPE_LABELS[txn.transactionType] || txn.transactionType}
                      </span>
                    </td>
                    <td className="tnum whitespace-nowrap px-3 py-2.5 text-mid">
                      {txn.isEMI
                        ? txn.emiNumber && txn.emiTenure
                          ? `${txn.emiNumber}/${txn.emiTenure}`
                          : "Yes"
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 pr-6">
                      <OwnerCell txn={txn} onEdit={setEditing} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <OwnerSheet txn={editing} open={Boolean(editing)} onClose={() => setEditing(null)} />
      <BulkOwnerSheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        cardId={activeCard}
      />
    </section>
  );
};

export default TransactionList;
