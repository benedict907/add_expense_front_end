import React, { useEffect, useRef } from "react";

/**
 * Scroll-reveal wrapper. Adds `is-in` once the element enters the viewport,
 * then unobserves — so nothing keeps running after the first paint pass.
 * `delay` staggers siblings without a JS timer.
 */
const Reveal = ({ children, delay = 0, className = "", as: Tag = "div", ...rest }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (or SSR-ish env): show immediately.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    // The reveal animation finishes on a transform, and a lingering transform
    // makes this element a containing block — which breaks `position: sticky`
    // and `position: fixed` inside it. Drop it once the animation is done.
    const done = () => el.classList.add("is-done");
    el.addEventListener("animationend", done);

    const io = new IntersectionObserver(
      ([entry]) => {
        // `isIntersecting` alone is not enough. During fast or programmatic
        // scrolling the browser coalesces callbacks, so an element that passed
        // entirely through the viewport between samples reports only "not
        // intersecting" and would stay invisible for good. Anything whose top
        // has already reached the viewport has been seen — reveal it.
        const seen =
          entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight;
        if (seen) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      // threshold 0, never a ratio: a percentage of a tall element can exceed
      // the viewport itself — a 9,800px transaction list needs 8% = 788px in
      // view, which a 526px phone can never satisfy, leaving the content stuck
      // at opacity 0. The bottom rootMargin still holds the reveal until the
      // element is properly on screen.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      el.removeEventListener("animationend", done);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
