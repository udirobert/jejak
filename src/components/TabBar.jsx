import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Compass, HeartPulse, Landmark } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import { TAP, SPRING, SPRING_SNAP } from "@/lib/motion";

// Bottom tab bar — persistent across the tabbed routes so the active pill
// slides between tabs (layoutId). Hidden during the immersive trace flow.
const TABS = [
  { to: "/", label: "Trace", icon: Crosshair },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/impact", label: "Impact", icon: HeartPulse },
  { to: "/embedded", label: "Bank", icon: Landmark },
];

export default function TabBar() {
  return (
    <motion.nav
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      exit={{ y: 120 }}
      transition={SPRING}
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 frosted-strong border-t border-white/60 safe-bottom"
    >
      <div className="flex items-stretch justify-around px-2 pt-1.5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => vibrate(6)}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 no-tap transition-colors ${
                isActive ? "text-jejak-navy" : "text-jejak-navy/45"
              }`
            }
          >
            {({ isActive }) => (
              <motion.div whileTap={TAP} className="flex flex-col items-center gap-0.5">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full">
                  {isActive && (
                    <motion.span
                      layoutId="tabPill"
                      className="absolute inset-0 rounded-full bg-jejak-navy"
                      transition={SPRING_SNAP}
                    />
                  )}
                  <Icon size={17} className={`relative z-10 ${isActive ? "text-amber-300" : ""}`} />
                </span>
                <span className="text-[10px] font-extrabold">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
}