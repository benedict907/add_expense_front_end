import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Close } from "./Icons";

/**
 * Centered sheet-style modal.
 * Escape closes, backdrop click closes, panel click does not.
 * On mobile it docks to the bottom like a native sheet; centered from `sm` up.
 */
const Modal = ({ open, onClose, title, subtitle, icon, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Freeze the page behind the sheet.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Rendered into <body> rather than in place. `.reveal` sets
  // `will-change: transform`, which makes any ancestor using it a containing
  // block for `position: fixed` — so a modal opened from inside a revealed
  // card would be positioned against that card and clipped by its
  // `overflow-hidden` instead of covering the viewport.
  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-void/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-pop card w-full max-w-md rounded-b-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-b-[22px] sm:p-6 sm:pb-6"
      >
        {/* Grab handle — mobile affordance only */}
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-white/15 sm:hidden" />

        {title && (
          <div className="mb-5 flex items-start gap-3">
            {icon && (
              <span className="tile h-9 w-9 rounded-xl text-lime">{icon}</span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold leading-tight text-hi">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-low">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="btn-icon -mr-1 -mt-1 h-8 w-8"
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
