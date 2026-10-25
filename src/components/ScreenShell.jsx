import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import CurrencySwitch from "./CurrencySwitch";
import PaperGrain from "./journal/PaperGrain";
import { HelpCircle } from "lucide-react";

const NAV = [
  { to: "/trace", label: "Trace" },
  { to: "/atlas", label: "Atlas" },
  { to: "/journal", label: "Journal" },
];

// Journal shell — warm paper, grain, editorial header. `variant="map"` and
// `variant="host-bank"` keep their legacy full-bleed behaviour for Phase 1b.
export default function ScreenShell({
  children,
  variant = "soft",
  header = true,
  showCurrency = variant !== "map",
  section = null,
}) {
  const { setShowHowTo } = useApp();
  const isMap = variant === "map";
  const isHostBank = variant === "host-bank";

  if (isMap || isHostBank) {
    return (
      <div
        className={`relative w-full ${
          isMap ? "h-[100dvh] overflow-hidden bg-[#153963]" : "safe-bottom min-h-screen bg-[#F5F7FA] text-slate-900"
        }`}
      >
        {header && !isHostBank && (
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pb-2 pt-3.5">
            <Link to="/" className="pointer-events-auto font-serif-display text-lg italic text-white drop-shadow-sm">
              Jejak
            </Link>
            <div className="pointer-events-auto flex items-center gap-1.5">
              {showCurrency && <CurrencySwitch />}
              <button
                type="button"
                onClick={() => setShowHowTo(true)}
                aria-label="How we work it out"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              >
                <HelpCircle size={17} />
              </button>
            </div>
          </header>
        )}
        <main className={isMap ? "relative h-full w-full overflow-hidden" : "flex-1 flex flex-col"}>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-journal-paper font-grotesk text-journal-ink">
      <PaperGrain />
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col">
        {header && (
          <header className="flex items-center justify-between px-5 pb-3 pt-4 lg:px-10">
            <div className="flex items-baseline gap-3">
              <Link
                to="/"
                className="font-serif-display text-xl italic text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
              >
                Jejak
              </Link>
              {section && (
                <span className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
                  {section}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="font-plexmono text-[11px] uppercase tracking-[0.12em] text-journal-ink-soft underline-offset-4 hover:text-journal-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
              {showCurrency && <CurrencySwitch />}
              <button
                type="button"
                onClick={() => setShowHowTo(true)}
                aria-label="How we work it out"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-journal-rule text-journal-ink no-tap hover:bg-journal-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              >
                <HelpCircle size={16} />
              </button>
            </div>
          </header>
        )}
        <main className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
