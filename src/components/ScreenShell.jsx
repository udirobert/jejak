import React from "react";
import { useApp } from "@/lib/AppContext";
import Logo from "./Logo";
import CurrencySwitch from "./CurrencySwitch";
import StageSidebars from "./StageSidebars";
import { HelpCircle } from "lucide-react";

// Shared shell: phone-width column, header with logo, optional currency switch
// (kept on Impact and money views; omitted on Home/sunrise and Explore/map).
export default function ScreenShell({
  children,
  variant = "soft",
  header = true,
  showCurrency = variant !== "sunrise" && variant !== "map",
  maxWidth = 420,
}) {
  const { setShowHowTo, startGuidedTour, tourStep } = useApp();
  const isMap = variant === "map";
  const isHostBank = variant === "host-bank";
  const isSunrise = variant === "sunrise";
  const hasTourBanner = tourStep != null;

  return (
    <div className="min-h-screen w-full flex justify-center bg-lilac-peach">
      <StageSidebars />
      <div
        className={`relative w-full min-h-screen flex flex-col xl:shadow-2xl ${
          isMap
            ? "h-[100dvh] overflow-hidden bg-[#153963]"
            : isHostBank
            ? "safe-bottom bg-[#F5F7FA] text-slate-900"
            : "safe-bottom"
        } ${hasTourBanner && !isMap ? "pt-36" : ""}`}
        style={{
          maxWidth,
          background: isSunrise
            ? "linear-gradient(175deg, #0F172A 0%, #1B1B3A 52%, #1E295B 100%)"
            : isMap
            ? "#153963"
            : isHostBank
            ? "#F5F7FA"
            : undefined,
        }}
      >
        {header && !isHostBank && (
          <header
            className={`flex items-center justify-between px-5 pt-3.5 pb-2 ${
              isMap
                ? "absolute inset-x-0 top-0 z-20 bg-transparent pointer-events-none"
                : ""
            }`}
          >
            <div className="pointer-events-auto flex items-center gap-2">
              <Logo size={32} />
              <span
                className={`text-lg font-extrabold tracking-tight ${
                  isMap || isSunrise
                    ? "text-white drop-shadow-sm"
                    : "text-jejak-navy"
                }`}
              >
                Jejak
              </span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={startGuidedTour}
                aria-label="Start interactive guided tour"
                className="min-h-[38px] rounded-full frosted border border-white/60 px-3 py-1 text-xs font-extrabold text-jejak-navy hover:bg-white/90 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Tour
              </button>
              {showCurrency && <CurrencySwitch />}
              <button
                type="button"
                onClick={() => setShowHowTo(true)}
                aria-label="How we estimate this"
                className="flex h-9 w-9 items-center justify-center rounded-full frosted border border-white/60 text-jejak-navy no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <HelpCircle size={17} />
              </button>
            </div>
          </header>
        )}
        <main
          className={`flex-1 flex flex-col ${
            isMap
              ? "relative h-full w-full overflow-hidden"
              : "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}