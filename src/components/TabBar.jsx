import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Compass, HeartPulse, Landmark } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import { TAP, SPRING, SPRING_SNAP } from "@/lib/motion";

// Bottom tab bar — rounded, frosted-glass floating dock with safe-area padding.
// Uses :focus-visible ONLY on the inner pill for keyboard users so mouse/touch taps
// and active tabs never show a double outline.
const TABS = [
  { to: "/", label: "Trace", icon: Crosshair },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/impact", label: "Impact", icon: HeartPulse },
  { to: "/embedded", label: "Bank", icon: Landmark },
];

export default function TabBar() {
  return (
    <motion.div
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      exit={{ y: 120 }}
      transition={SPRING}
      className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none safe-bottom"
    >
      <div className="w-full max-w-[420px] px-3.5 pb-2.5 pt-1">
        <nav
          aria-label="Primary navigation"
          className="pointer-events-auto w-full rounded-3xl frosted-strong border border-white/75 shadow-[0_12px_36px_rgba(27,27,58,0.22)] px-2 py-1.5"
        >
          <div className="flex items-stretch justify-around gap-1">
            {TABS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={(e) => {
                  vibrate(6);
                  e.currentTarget.blur();
                }}
                style={{ outline: "none", boxShadow: "none" }}
                className={({ isActive }) =>
                  `group relative min-h-[44px] flex flex-1 flex-col items-center justify-center rounded-2xl py-1 no-tap transition-colors outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 ${
                    isActive
                      ? "text-jejak-navy"
                      : "text-jejak-navy/55 hover:text-jejak-navy"
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={TAP}
                    className="relative flex flex-col items-center gap-0.5"
                  >
                    <span className="relative flex h-8 w-11 items-center justify-center rounded-full group-focus-visible:ring-2 group-focus-visible:ring-amber-400">
                      {isActive && (
                        <motion.span
                          layoutId="tabPill"
                          className="absolute inset-0 rounded-full bg-jejak-navy shadow-sm"
                          transition={SPRING_SNAP}
                        />
                      )}
                      <Icon
                        size={16}
                        className={`relative z-10 transition-colors ${
                          isActive ? "text-jejak-gold" : ""
                        }`}
                      />
                    </span>
                    <span className="text-[10px] font-extrabold tracking-tight">
                      {label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </motion.div>
  );
}