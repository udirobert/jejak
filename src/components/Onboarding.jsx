import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { vibrate } from "@/lib/haptics";
import Logo from "./Logo";
import { ArrowRight } from "lucide-react";

// First-run onboarding: 3 slides framing the mission. Shows once per device
// (a single UI flag in localStorage — no product data is persisted).
const SLIDES = [
  {
    title: "You deserve a receipt for everything you buy.",
    body: "Every product has a hidden journey. Jejak makes the payment visible.",
    emoji: "🧾",
  },
  {
    title: "Scan a product. See where it came from.",
    body: "Photograph an item and we trace its likely route across the world.",
    emoji: "🌍",
  },
  {
    title: "See where every penny goes.",
    body: "Watch your money split into materials, labour, freight, brand and retail.",
    emoji: "🪙",
    stat: "65% of shoppers would switch to brands that reveal product origins.",
    source: "Source: ESW",
  },
];

const STORAGE_KEY = "jejak_onboarded_v1";

export function hasOnboarded() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Onboarding() {
  const { reset } = useApp();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(() => !hasOnboarded());

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    vibrate(12);
    setOpen(false);
    reset();
  };

  const next = () => {
    vibrate(8);
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else finish();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-lilac-peach"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative flex h-full w-full max-w-[420px] flex-col px-7 py-10" style={{ background: "linear-gradient(160deg,#FF8A65 0%,#FFC24B 50%,#FF3D81 120%)" }}>
            <div className="flex flex-1 flex-col items-center justify-center text-center text-white">
              <motion.div
                key={`emoji-${idx}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="text-7xl"
              >
                {SLIDES[idx].emoji}
              </motion.div>
              <div className="mt-6 flex items-center gap-2">
                <Logo size={26} glow={false} />
                <span className="text-sm font-extrabold tracking-wide">Jejak</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <h2 className="text-2xl font-extrabold leading-tight drop-shadow-sm">{SLIDES[idx].title}</h2>
                  <p className="mt-3 text-sm font-semibold text-white/90">{SLIDES[idx].body}</p>
                  {SLIDES[idx].stat && (
                    <p className="mt-4 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white">
                      {SLIDES[idx].stat}
                      <span className="ml-1 font-semibold text-white/70">{SLIDES[idx].source}</span>
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === idx ? 22 : 8, background: i === idx ? "#fff" : "#ffffff66" }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-jejak-navy no-tap"
            >
              {idx < SLIDES.length - 1 ? "Continue" : "Start tracing"}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={finish}
              className="mt-2 w-full py-2 text-xs font-semibold text-white/70 no-tap"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}