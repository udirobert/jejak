import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, Compass, NotebookPen, Radio } from "lucide-react";
import { vibrate } from "@/lib/haptics";
import { TAP, SPRING } from "@/lib/motion";

// Bottom tab bar — paper card with a top rule, thin ink icons, Plex Mono labels.
// Hidden on >=lg where the header nav takes over.
const TABS = [
  { to: "/trace", label: "Trace", icon: Crosshair },
  { to: "/atlas", label: "Atlas", icon: Compass },
  { to: "/room", label: "Floor", icon: Radio, live: true },
  { to: "/journal", label: "Journal", icon: NotebookPen },
];

export default function TabBar() {
  return (
    <motion.div
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      exit={{ y: 120 }}
      transition={SPRING}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center safe-bottom lg:hidden"
    >
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto w-full border-t border-journal-rule bg-journal-card px-4 pb-1 pt-1.5 shadow-[0_-8px_24px_-12px_rgba(30,27,22,0.25)]"
      >
        <div className="flex items-stretch justify-around">
          {TABS.map(({ to, label, icon: Icon, live }) => (
            <NavLink
              key={to}
              to={to}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => vibrate(6)}
              className={({ isActive }) =>
                `group relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
                  isActive ? "text-journal-ink" : "text-journal-ink-soft hover:text-journal-ink"
                }`
              }
            >
              {({ isActive }) => (
                <motion.div whileTap={TAP} className="relative flex flex-col items-center gap-0.5">
                  <span className="relative flex items-center justify-center">
                    <Icon size={18} strokeWidth={1.5} />
                    {live && (
                      <span className="absolute -right-1.5 -top-0.5 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-journal-stamp opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-journal-stamp" />
                      </span>
                    )}
                  </span>
                  <span className="font-plexmono text-[10px] uppercase tracking-[0.12em]">{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="tabDot"
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-journal-stamp"
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </motion.div>
  );
}
