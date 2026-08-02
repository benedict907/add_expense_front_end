/**
 * Full-height loading state. Two counter-rotating arcs in the brand accent —
 * pure CSS transform animation, no layout work per frame.
 */
const Loader = ({ label = "Loading" }: { label?: string }) => {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <span
          className="absolute inset-0 rounded-full border-2 border-white/10"
          aria-hidden
        />
        <span
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "var(--color-lime)",
            borderRightColor: "var(--color-lime)",
            animation: "vault-spin 0.85s linear infinite",
          }}
          aria-hidden
        />
        <span
          className="absolute inset-[7px] rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "var(--color-iris)",
            animation: "vault-spin 1.3s linear infinite reverse",
          }}
          aria-hidden
        />
      </div>
      <p className="text-[13px] text-low" role="status">
        {label}…
      </p>
    </div>
  );
};

export default Loader;
