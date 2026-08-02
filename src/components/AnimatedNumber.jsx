import React, { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// easeOutExpo — fast arrival, long settle. Reads as "counting up and landing".
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Counts from the previously rendered value to `value` on every change.
 * Drives a single rAF loop, writes to state only (no layout reads),
 * and snaps instantly when the user prefers reduced motion.
 *
 * Props:
 *   value     number  target
 *   format    (n)=>string
 *   duration  ms, default 900
 */
const AnimatedNumber = ({
  value = 0,
  format = (n) => String(Math.round(n)),
  duration = 900,
  className = "",
}) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;

    if (from === to) return;

    if (prefersReducedMotion()) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (to - from) * easeOutExpo(t);
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
};

export default AnimatedNumber;
