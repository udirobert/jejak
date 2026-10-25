// Semi-transparent tape strip for pinning cards/photos to the page.
export default function WashiTape({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute -top-3 left-8 z-10 h-6 w-24 ${className}`}
      style={{
        background: "color-mix(in srgb, var(--j-stamp) 32%, transparent)",
        opacity: 0.75,
        transform: "rotate(-4deg)",
        clipPath: "polygon(2% 0, 98% 4%, 100% 96%, 0 100%)",
      }}
    />
  );
}
