import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { vibrate } from "@/lib/haptics";

// Contextual progressive coachmark pill. Shows a clear 1-line tip the first time
// a user visits a screen (or during guided tour mode) and remembers dismissal.
export default function CoachmarkPill({
  id,
  stepBadge,
  text,
  forceShow = false,
  variant = "light",
}) {
  const storageKey = `jejak_coach_${id}_v1`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (forceShow) setDismissed(false);
  }, [forceShow]);

  const dismiss = () => {
    vibrate(5);
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
  };

  const visible = forceShow || !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`mt-2 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs shadow-sm border ${
            variant === "dark"
              ? "bg-jejak-navy/90 text-white border-white/25"
              : "bg-amber-300/25 text-jejak-navy border-amber-400/50 backdrop-blur-md"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {stepBadge ? (
              <span className="shrink-0 rounded-full bg-jejak-navy px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                {stepBadge}
              </span>
            ) : (
              <Sparkles size={13} className="shrink-0 text-amber-400" />
            )}
            <p className="font-bold leading-snug text-[11px]">{text}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss tip"
            className="shrink-0 rounded-full p-1 opacity-65 hover:opacity-100 no-tap"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}