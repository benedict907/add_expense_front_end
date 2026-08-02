import React from "react";

/**
 * Stroke icon set. 24x24 grid, currentColor, 1.75 stroke.
 * Every icon takes className so size/colour come from the caller.
 */
const Svg = ({ children, className = "h-4 w-4", ...rest }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const Wallet = (p) => (
  <Svg {...p}>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
    <path d="M3 9V7a2 2 0 0 1 1.6-1.96l10-2A2 2 0 0 1 17 5v1" />
    <circle cx="17" cy="12.5" r="1.25" fill="currentColor" stroke="none" />
  </Svg>
);

export const ArrowDownLeft = (p) => (
  <Svg {...p}>
    <path d="M17 7 7 17" />
    <path d="M16 17H7V8" />
  </Svg>
);

export const ArrowUpRight = (p) => (
  <Svg {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Svg>
);

export const TrendUp = (p) => (
  <Svg {...p}>
    <path d="m3 16 5.5-5.5 3.5 3.5L21 5" />
    <path d="M15 5h6v6" />
  </Svg>
);

export const TrendDown = (p) => (
  <Svg {...p}>
    <path d="m3 8 5.5 5.5L12 10l9 9" />
    <path d="M15 19h6v-6" />
  </Svg>
);

export const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const Close = (p) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const Check = (p) => (
  <Svg {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Svg>
);

export const Trash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M5.5 7 6.6 19.1A2 2 0 0 0 8.6 21h6.8a2 2 0 0 0 2-1.9L18.5 7" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

export const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const Clock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const Target = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const Receipt = (p) => (
  <Svg {...p}>
    <path d="M5 3.5v17l2.5-1.6 2.5 1.6 2-1.6 2 1.6 2.5-1.6L19 20.5v-17a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);

export const Card = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path d="M2.5 10h19" />
    <path d="M6.5 15h3" />
  </Svg>
);

export const Basket = (p) => (
  <Svg {...p}>
    <path d="M4 9h16l-1.4 9.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8Z" />
    <path d="m8.5 9 2-5M15.5 9l-2-5" />
    <path d="M10 13.5v3M14 13.5v3" />
  </Svg>
);

export const Layers = (p) => (
  <Svg {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3.5 12.5 8.5 4.7 8.5-4.7" />
  </Svg>
);

export const Bell = (p) => (
  <Svg {...p}>
    <path d="M18 15.5V11a6 6 0 1 0-12 0v4.5L4.5 18h15z" />
    <path d="M9.5 21h5" />
  </Svg>
);

export const Copy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M15 6V5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15H6" />
  </Svg>
);

export const Logout = (p) => (
  <Svg {...p}>
    <path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" />
    <path d="M10 8 6 12l4 4" />
    <path d="M6 12h9" />
  </Svg>
);

export const Sparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
    <path d="M18.5 3.5v3M20 5h-3" />
  </Svg>
);

export const Phone = (p) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </Svg>
);

export const Shield = (p) => (
  <Svg {...p}>
    <path d="M12 3 5 5.8v5.5c0 4.3 2.9 8.1 7 9.2 4.1-1.1 7-4.9 7-9.2V5.8z" />
    <path d="m9.2 12 2 2 3.6-3.7" />
  </Svg>
);

export const Chart = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const Note = (p) => (
  <Svg {...p}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Svg>
);

export const Alert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.4" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const Inbox = (p) => (
  <Svg {...p}>
    <path d="M3.5 13.5h4l1.5 3h6l1.5-3h4" />
    <path d="M5.6 5.2 3.5 13.5v3A2.5 2.5 0 0 0 6 19h12a2.5 2.5 0 0 0 2.5-2.5v-3l-2.1-8.3A2 2 0 0 0 16.5 3.7h-9a2 2 0 0 0-1.9 1.5Z" />
  </Svg>
);

/** Maps a spend category to its icon + accent hue. */
export const categoryVisual = (category = "") => {
  const key = category.toLowerCase();
  if (key.includes("grocer") || key.includes("food"))
    return { Icon: Basket, hue: "var(--color-mint)" };
  if (key.includes("hdfc")) return { Icon: Card, hue: "var(--color-iris)" };
  if (key.includes("sbi")) return { Icon: Card, hue: "var(--color-violet)" };
  if (key.includes("icic")) return { Icon: Card, hue: "var(--color-amber)" };
  if (key.includes("kotak")) return { Icon: Card, hue: "var(--color-coral)" };
  if (key.includes("misc")) return { Icon: Layers, hue: "var(--color-mid)" };
  return { Icon: Receipt, hue: "var(--color-lime)" };
};
