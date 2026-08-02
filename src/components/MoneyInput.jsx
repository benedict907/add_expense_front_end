import React from "react";

/**
 * Currency input that makes decimal entry painless.
 * - Holds a raw string in the parent (never coerces to number mid-typing),
 *   so "10." and "10.5" survive keystroke-by-keystroke.
 * - Sanitizes to digits + a single dot, max 2 decimal places.
 * - Mobile shows the numeric/decimal keypad via inputMode.
 * - Optional quick-adjust chips for fast round-number entry.
 *
 * Props:
 *   value          string   controlled raw value
 *   onValueChange  (str)    called with sanitized string
 *   quickAdjust    number[] optional +buttons, e.g. [100, 500, 1000]
 */
const sanitizeMoney = (raw) => {
  let v = String(raw).replace(/[^0-9.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    // keep only the first dot
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    const [int, dec] = v.split(".");
    v = int + "." + dec.slice(0, 2);
  }
  return v;
};

export const toNumber = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const MoneyInput = ({
  value,
  onValueChange,
  quickAdjust,
  className = "",
  placeholder = "0",
  autoFocus,
  accent = "var(--color-lime)",
  ...rest
}) => {
  const handleChange = (e) => onValueChange(sanitizeMoney(e.target.value));

  const bump = (delta) => {
    const next = Math.max(0, Math.round((toNumber(value) + delta) * 100) / 100);
    onValueChange(String(next));
  };

  const clear = () => onValueChange("");

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-xl font-medium"
          style={{ color: accent }}
        >
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`field tnum py-3.5 pl-9 pr-10 text-xl font-medium ${className}`}
          {...rest}
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear amount"
            className="btn-icon absolute inset-y-0 right-1.5 my-auto h-7 w-7 text-low"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {quickAdjust && quickAdjust.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickAdjust.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => bump(amt)}
              className="chip tnum"
            >
              +{amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MoneyInput;
