import { motion, useReducedMotion } from "framer-motion";
import Stamp from "./Stamp";
import WashiTape from "./WashiTape";

// Waiting-as-artifact: a taped index card on the page while data loads.
export default function PageLoader({ label = "Opening…", note = null, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex items-center justify-center px-5 py-14 ${className}`} role="status" aria-live="polite">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-[300px] border border-journal-rule bg-journal-card p-5 pt-7 shadow-[0_14px_30px_-16px_rgba(30,27,22,0.3)]"
      >
        <WashiTape />
        <div className="flex items-center gap-4">
          <div className={reduce ? "" : "motion-safe:animate-pulse-soft"}>
            <Stamp shape="rect" country="Field desk" code="JJK" date="ON ITS WAY" rotation={-3} animate={!reduce} className="bg-journal-card" />
          </div>
          <div className="min-w-0">
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">{label}</p>
            {note && <p className="mt-1 font-hand text-lg leading-tight text-journal-ink-soft">{note}</p>}
          </div>
        </div>
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-1 w-7 bg-journal-rule/70 motion-safe:animate-pulse"
              style={reduce ? undefined : { animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
