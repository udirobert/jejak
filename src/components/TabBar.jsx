import React from "react";
import { NavLink } from "react-router-dom";
import { Crosshair, Compass, HeartPulse, Landmark } from "lucide-react";

// Bottom tab bar — the main app's primary navigation. Hidden during the
// active trace flow (identifying/journey/split) so those screens stay immersive.
const TABS = [
  { to: "/", label: "Trace", icon: Crosshair },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/impact", label: "Impact", icon: HeartPulse },
  { to: "/embedded", label: "Bank", icon: Landmark },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 frosted-strong border-t border-white/60 safe-bottom">
      <div className="flex items-stretch justify-around px-2 pt-1.5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 no-tap transition-colors ${
                isActive ? "text-jejak-navy" : "text-jejak-navy/45"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-jejak-navy text-amber-300" : ""
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="text-[10px] font-extrabold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}