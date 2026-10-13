import React from "react";
import { useApp } from "@/lib/AppContext";
import Logo from "./Logo";
import CurrencySwitch from "./CurrencySwitch";
import StageSidebars from "./StageSidebars";
import { HelpCircle } from "lucide-react";

// Shared shell: phone-width column, lilac-to-peach background, header with
// logo, currency switch and a "how we estimate" link.
// For variant="map", the map flows full-bleed behind the transparent header with no dark band.
export default function ScreenShell({
  children,
  variant = "soft",
  header = true,
  maxWidth = 420,
}) {
  const { setShowHowTo, startGuidedTour } = useApp();
  const isMap = variant === "map";
  const isHostBank = variant === "host-bank";

  return (
    <div className="min-h-screen w-full flex justify-center bg-lilac-peach">
      <StageSidebars />
      <div
        className={`relative w-full min-h-screen flex flex-col safe-bottom xl:shadow-2xl ${
          isMap
            ? "overflow-hidden bg-[#143356]"
            : isHostBank
            ? "bg-[#F5F7FA] text-slate-900"
            : ""
        }`}
        style={{
          maxWidth,
          background:
            variant === "sunrise"
              ? "linear-gradient(160deg,#FF8A65 0%,#FFC24B 45%,#FF3D81 120%)"
              : isMap
              ? "#143356"
              : isHostBank
              ? "#F5F7FA"
              : undefined,
        }}
      >
        {header && !isHostBank && (
          <header
            className={`flex items-center justify-between px-5 pt-5 pb-3 ${
              isMap
                ? "absolute inset-x-0 top-0 z-20 bg-transparent pointer-events-none"
                : ""
            }`}
          >
            <div className="pointer-events-auto flex items-center gap-2">
              <Logo size={34} />
              <span
                className={`text-lg font-extrabold tracking-tight ${
                  isMap ? "text-white drop-shadow" : "text-jejak-navy"
                }`}
              >
                Jejak
              </span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={startGuidedTour}
                className="rounded-full frosted border border-white/60 px-2.5 py-1.5 text-[11px] font-extrabold text-jejak-navy hover:bg-white/90 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Tour
              </button>
              <CurrencySwitch />
              <button
                type="button"
                onClick={() => setShowHowTo(true)}
                aria-label="How we estimate this"
                className="flex h-9 w-9 items-center justify-center rounded-full frosted border border-white/60 text-jejak-navy no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </header>
        )}
        <main
          className={`flex-1 flex flex-col ${
            isMap
              ? "h-screen"
              : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}