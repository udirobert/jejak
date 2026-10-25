// Full-page paper grain — fixed fractal-noise overlay. Render once near the root.
export default function PaperGrain({ opacity = 0.06 }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ opacity, mixBlendMode: "multiply" }}
    >
      <svg width="100%" height="100%">
        <filter id="j-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#j-grain)" />
      </svg>
    </div>
  );
}
