import React from "react";

/**
 * Segmented control with a sliding thumb.
 * The thumb is one absolutely-positioned element moved by translateX %,
 * so switching tabs animates on the compositor instead of repainting buttons.
 *
 * Props:
 *   options  [{ value, label, icon?, fill?, text? }]
 *   value    currently selected value
 *   onChange (value) => void
 */
const Segmented = ({ options, value, onChange, className = "", size = "md" }) => {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const active = options[index] ?? options[0];
  const n = options.length;

  // Thumb spans exactly one grid column; it steps by its own width + the gap.
  const thumbWidth = `calc((100% - 0.5rem - ${(n - 1) * 0.25}rem) / ${n})`;
  const thumbShift = `translateX(calc(${index} * (100% + 0.25rem)))`;

  const pad = size === "sm" ? "py-1.5 text-xs" : "py-2 text-[13px]";

  return (
    <div
      className={`seg ${className}`}
      style={{
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        "--seg-fill": active?.fill ?? "rgba(255,255,255,0.1)",
      }}
      role="tablist"
    >
      <span
        className="seg-thumb"
        style={{ width: thumbWidth, transform: thumbShift }}
        aria-hidden="true"
      />
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            onClick={() => onChange(opt.value)}
            className={`seg-item flex items-center justify-center gap-1.5 ${pad}`}
            style={isActive && opt.text ? { "--seg-text": opt.text } : undefined}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default Segmented;
