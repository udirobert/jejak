// Handwritten margin annotation (Caveat). arrow: "left" | "right" | "up" | none.
export default function MarginNote({ children, tone = "ink", arrow = null, className = "" }) {
  const color = tone === "stamp" ? "text-journal-stamp" : "text-journal-ink-soft";
  const arrowPaths = {
    left: "M28 12 C 20 10, 12 12, 4 18 M4 18 l5 -4 M4 18 l6 2",
    right: "M4 12 C 12 10, 20 12, 28 18 M28 18 l-5 -4 M28 18 l-6 2",
    up: "M14 26 C 16 20, 16 14, 14 6 M14 6 l-4 5 M14 6 l4 5",
  };
  return (
    <span className={`inline-flex items-center gap-1 font-hand text-lg leading-none ${color} ${className}`}>
      {arrow === "left" && (
        <svg width="30" height="24" viewBox="0 0 32 26" aria-hidden="true" className="shrink-0 -scale-x-100">
          <path d={arrowPaths.left} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span>{children}</span>
      {(arrow === "right" || arrow === "up") && (
        <svg width="30" height="24" viewBox="0 0 32 26" aria-hidden="true" className="shrink-0">
          <path d={arrowPaths[arrow]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}
