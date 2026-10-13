import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import ScreenShell from "@/components/ScreenShell";
import { useReducedMotion } from "framer-motion";

const STATUSES = [
  "Reading label…",
  "Identifying product…",
  "Tracing likely route…",
];

export default function Identifying() {
  const { photo, product, setScreen, lowConfidence } = useApp();
  const reduce = useReducedMotion();
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setStatusIdx((i) => (i + 1) % STATUSES.length), 950);
    const done = setTimeout(() => setScreen("journey"), reduce ? 1200 : 2900);
    return () => { clearInterval(t1); clearTimeout(done); };
  }, [setScreen, reduce]);

  return (
    <ScreenShell header={false} variant="sunrise">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="relative h-72 w-72 overflow-hidden rounded-3xl frosted-strong">
          {photo ? (
            <img src={photo} alt="Your scan" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">{product.emoji}</div>
          )}

          {/* scanning overlay */}
          <div className="absolute inset-0 bg-jejak-navy/10" />
          <motion.div
            className="absolute inset-x-0 h-1.5"
            style={{ background: "linear-gradient(90deg, transparent, #FFC24B, transparent)", boxShadow: "0 0 16px #FFC24B" }}
            initial={{ top: "8%" }}
            animate={{ top: ["8%", "92%", "8%"] }}
            transition={reduce ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-6 rounded-2xl border-2 border-white/70" />
        </div>

        <div className="mt-8 h-7">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center text-lg font-bold text-white"
            >
              {STATUSES[statusIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {lowConfidence && (
          <p className="mt-2 rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-white">
            Low confidence — showing a category-level estimate
          </p>
        )}
      </div>
    </ScreenShell>
  );
}