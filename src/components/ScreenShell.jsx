import React from "react";
import { useApp } from "@/lib/AppContext";
import Logo from "./Logo";
import CurrencySwitch from "./CurrencySwitch";
import StageSidebars from "./StageSidebars";
import { HelpCircle } from "lucide-react";

// Shared shell: phone-width column, lilac-to-peach background, header with
// logo, currency switch and a "how we estimate" link. Used on every screen.
export default function ScreenShell({ children, variant = "soft", header = true, maxWidth = 420 }) {
  const { setShowHowTo, startGuidedTour } = useApp();
  const isMap = variant === "map";
  return (
    <div className="min-h-screen w-full flex justify-center bg-lilac-peach">
      <StageSidebars />
      <div
        className={`relative w-full min-h-screen flex flex-col safe-bottom xl:shadow-2xl ${
          isMap ? "overflow-hidden bg-[#0B132B]" : ""
        }`}
        style={{
          maxWidth,
          background:
            variant === "sunrise"
              ? "linear-gradient(160deg,#FF8A65 0%,#FFC24B 45%,#FF3D81 120%)"
              : isMap
              ? "#0B132B"
              : undefined,
        }}
      >
        {header && (
          <header
            className={`flex items-center justify-between px-5 pt-5 pb-3 ${
              isMap ? "relative z-20" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Logo size={34} />
              <span
                className={`text-lg font-extrabold tracking-tight ${
                  isMap ? "text-white drop-shadow-sm" : "text-jejak-navy"
                }`}
              >
                Jejak
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={startGuidedTour}
                className="rounded-full frosted border border-white/60 px-2.5 py-1.5 text-[11px] font-extrabold text-jejak-navy hover:bg-white/90 no-tap"
              >
                Tour
              </button>
              <CurrencySwitch />
              <button
                type="button"
                onClick={() => setShowHowTo(true)}
                aria-label="How we estimate this"
                className="flex h-9 w-9 items-center justify-center rounded-full frosted border border-white/60 text-jejak-navy no-tap"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </header>
        )}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}