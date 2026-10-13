import React from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";

// Big gold shutter button. Triggers a hidden file input with capture=environment.
export default function ShutterButton({ onPick, disabled = false }) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="relative no-tap flex items-center justify-center rounded-full"
      style={{
        width: 96,
        height: 96,
        background: "radial-gradient(circle at 38% 32%, #FFF3C4 0%, #FFC24B 45%, #E8921A 100%)",
        boxShadow: "0 10px 30px rgba(232,146,26,0.45), inset 0 2px 6px rgba(255,255,255,0.6)",
        border: "4px solid #fff",
      }}
      aria-label="Scan a product"
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ border: "2px solid rgba(255,255,255,0.6)" }}
        animate={{ scale: [1, 1.18], opacity: [0.7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <Logo size={44} glow={false} />
    </motion.button>
  );
}