import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Logo from "./Logo";
import { vibrate } from "@/lib/haptics";

// Hero gold J coin shutter button. Respects prefers-reduced-motion, provides
// tactile press state and haptic feedback, and exceeds 44px minimum tap target.
export default function ShutterButton({ onPick, disabled = false }) {
  const reduce = useReducedMotion();

  const handleTap = () => {
    if (disabled) return;
    vibrate([0, 10, 20, 8]);
    if (onPick) onPick();
  };

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      disabled={disabled}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="relative no-tap flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
      style={{
        width: 92,
        height: 92,
        background:
          "radial-gradient(circle at 38% 32%, #FFF3C4 0%, #FFC24B 45%, #E8921A 100%)",
        boxShadow:
          "0 12px 32px rgba(232,146,26,0.48), inset 0 2px 6px rgba(255,255,255,0.65)",
        border: "4px solid #fff",
      }}
      aria-label="Tap J coin to scan or photograph a product"
    >
      {!reduce && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(255,194,75,0.75)" }}
          animate={{ scale: [1, 1.2], opacity: [0.75, 0] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <Logo size={44} glow={false} />
    </motion.button>
  );
}