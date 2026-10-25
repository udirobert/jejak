import { motion, useReducedMotion } from "framer-motion";

// Postmark stamp — circular or rect, double-ring border, Plex Mono text.
// animate: "thunk" entry (scale 1.35 -> 1, opacity 0 -> 1, rotate settle).
export default function Stamp({
  country,
  code,
  date = "12 JUN 2025",
  rotation = -6,
  animate = false,
  delay = 0,
  shape = "circle",
  className = "",
  color = "var(--j-stamp)",
}) {
  const reduce = useReducedMotion();
  const initial = animate && !reduce
    ? { scale: 1.35, opacity: 0, rotate: rotation + 8 }
    : { scale: 1, opacity: 1, rotate: rotation };
  const anim = { scale: 1, opacity: 1, rotate: rotation };

  if (shape === "rect") {
    return (
      <motion.div
        initial={initial}
        animate={anim}
        transition={{ duration: 0.35, delay, ease: [0.2, 1.4, 0.4, 1] }}
        className={`inline-flex flex-col items-center justify-center px-3 py-1.5 ${className}`}
        style={{ border: `1.5px solid ${color}`, boxShadow: `inset 0 0 0 1.5px var(--j-card), inset 0 0 0 3px ${color}`, color }}
      >
        <span className="font-plexmono text-[9px] uppercase tracking-[0.08em]">{country}</span>
        <span className="font-plexmono text-[10px] font-medium uppercase tracking-[0.08em]">{code} · {date}</span>
      </motion.div>
    );
  }

  const id = `st-${code}-${Math.abs(rotation * 7)}`;
  return (
    <motion.svg
      viewBox="0 0 100 100"
      initial={initial}
      animate={anim}
      transition={{ duration: 0.35, delay, ease: [0.2, 1.4, 0.4, 1] }}
      className={`inline-block h-16 w-16 ${className}`}
      role="img"
      aria-label={`Postmark stamp: ${country}`}
    >
      <defs>
        <path id={`${id}-top`} d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2" opacity="0.9" />
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="1" opacity="0.8" />
      <text fill={color} fontSize="9.5" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.2" opacity="0.9">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {(country || "").toUpperCase().slice(0, 22)}
        </textPath>
      </text>
      <text x="50" y="56" textAnchor="middle" fill={color} fontSize="15" fontWeight="500" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5">
        {code}
      </text>
      <text x="50" y="68" textAnchor="middle" fill={color} fontSize="6.5" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1">
        {date}
      </text>
    </motion.svg>
  );
}
