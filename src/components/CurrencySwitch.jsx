import React from "react";
import { useApp } from "@/lib/AppContext";

// £ | S$ — journal segmented control. Never converts via exchange rate: each
// product has its own per-market price, so switching currency switches market.
export default function CurrencySwitch() {
  const { currency, setCurrency } = useApp();
  const options = [
    { value: "GBP", label: "£" },
    { value: "SGD", label: "S$" },
  ];
  return (
    <div
      className="flex items-center font-plexmono text-sm"
      role="group"
      aria-label="Switch currency"
    >
      {options.map((o, i) => {
        const active = currency === o.value;
        return (
          <React.Fragment key={o.value}>
            {i > 0 && <span className="px-1 text-journal-rule" aria-hidden="true">|</span>}
            <button
              type="button"
              onClick={() => setCurrency(o.value)}
              aria-pressed={active}
              className={`min-h-[44px] px-2 py-1 no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp ${
                active
                  ? "font-medium text-journal-ink underline decoration-journal-stamp decoration-2 underline-offset-4"
                  : "text-journal-ink-soft hover:text-journal-ink"
              }`}
            >
              {o.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
