import React from "react";
import {
  useCreditCards,
  currency,
  formatMonth,
} from "../../context/CreditCardContext";
import { Check, Alert, Inbox, Sparkle } from "../Icons";

/**
 * Sync trigger plus the per-card outcome of the last run.
 * Every card gets a row — success, "Statement not found" and failures are all
 * visible, so nothing fails silently.
 */

const STAGES = [
  "Finding statement emails",
  "Downloading attachments",
  "Decrypting PDFs",
  "Extracting transactions",
  "Matching owners",
  "Saving",
];

const STATUS_STYLE = {
  IMPORTED: { hue: "var(--color-mint)", Icon: Check, label: "Imported" },
  UPDATED: { hue: "var(--color-mint)", Icon: Check, label: "Re-imported" },
  ALREADY_IMPORTED: { hue: "var(--color-mid)", Icon: Check, label: "Already imported" },
  NOT_FOUND: { hue: "var(--color-amber)", Icon: Inbox, label: "Statement not found" },
  FAILED: { hue: "var(--color-coral)", Icon: Alert, label: "Failed" },
};

const ResultRow = ({ result }) => {
  const style = STATUS_STYLE[result.status] ?? STATUS_STYLE.FAILED;
  const { Icon } = style;
  const mismatch = result.reconciliation === "MISMATCH";

  return (
    <div className="well p-3">
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${style.hue} 16%, transparent)` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: style.hue }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-hi">
            <span className="truncate">{result.cardName}</span>
            <span className="text-[11px] font-semibold" style={{ color: style.hue }}>
              {style.label}
            </span>
          </p>
          {result.message && (
            <p className="mt-0.5 break-words text-[11px] leading-relaxed text-low">
              {result.message}
            </p>
          )}

          {result.transactionCount > 0 && (
            <p className="tnum mt-1.5 text-[11px] text-mid">
              {result.transactionCount} transactions ·{" "}
              <span className="text-mint">{result.ownersDetected} owners detected</span>
              {result.needsReview > 0 && (
                <>
                  {" · "}
                  <span className="text-amber">{result.needsReview} need review</span>
                </>
              )}
            </p>
          )}

          {mismatch && (
            <p className="mt-2 rounded-lg border border-amber/25 bg-amber/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber">
              Statement total doesn&apos;t match extracted transactions.
              <span className="tnum block">
                Expected {currency(result.expectedTotal)} · Extracted{" "}
                {currency(result.extractedTotal)} · Difference{" "}
                {currency(Math.abs(result.difference))}
              </span>
            </p>
          )}

          {result.reconciliation === "RECONCILED" && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-mint">
              <Check className="h-3 w-3" />
              Statement reconciled
            </p>
          )}

          {(result.warnings || []).map((warning) => (
            <p key={warning} className="mt-1.5 text-[11px] leading-relaxed text-amber">
              {warning}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const SyncPanel = () => {
  const { runSync, syncing, syncResults, syncError, lastSync, selectedMonth } =
    useCreditCards();

  const lastSyncedLabel = lastSync?.syncedAt
    ? new Date(lastSync.syncedAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

  return (
    <section className="card card-hover p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Statement import</p>
          <p className="mt-1 text-[13px] text-mid">
            Pulls {formatMonth(selectedMonth)} statements from Gmail
          </p>
          <p className="mt-0.5 text-[11px] text-low">Last synced: {lastSyncedLabel}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runSync().catch(() => {})}
            disabled={syncing}
            className="btn btn-accent px-4 py-2.5 text-[13px]"
          >
            <Sparkle className="h-4 w-4" />
            {syncing ? "Syncing…" : "Sync statements"}
          </button>
          {syncResults && !syncing && (
            <button
              type="button"
              onClick={() => runSync({ force: true }).catch(() => {})}
              className="btn btn-soft px-3.5 py-2.5 text-[13px]"
              title="Re-download and re-parse, keeping owners you set by hand"
            >
              Re-parse
            </button>
          )}
        </div>
      </div>

      {syncing && (
        <ol className="mt-4 space-y-1.5">
          {STAGES.map((stage) => (
            <li key={stage} className="flex items-center gap-2 text-[12px] text-mid">
              <span className="live-dot" />
              {stage}
            </li>
          ))}
        </ol>
      )}

      {syncError && (
        <p className="anim-fade mt-4 flex items-start gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-[13px] text-coral">
          <Alert className="mt-0.5 h-4 w-4 shrink-0" />
          {syncError}
        </p>
      )}

      {syncResults && !syncing && (
        <div className="mt-4 space-y-2">
          {syncResults.results.map((result) => (
            <ResultRow key={result.cardId} result={result} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SyncPanel;
