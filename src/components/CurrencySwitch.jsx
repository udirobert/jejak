import React from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";

// S$ | £ switch. Never converts via exchange rate — each product has its own
// per-market price, so switching currency also switches the market.
export default function CurrencySwitch() {
  const { currency, setCurrency } = useApp();
  const options = [
    { value: "GBP", label: "£" },
    { value: "SGD", label: "S$" },
  ];
  return (
    <div
      className="relative flex items-center rounded-full p-1 frosted border border-white/60"
      role="group"
      aria-label="Switch currency"
    >
      {options.map((o) => {
        const active = currency === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setCurrency(o.value)}
            aria-pressed={active}
            className="relative z-10 px-3 py-1.5 text-sm font-bold no-tap transition-colors"
            style={{ color: active ? "#fff" : "#1B1B3A" }}
          >
            {active && (
              <motion.span
                layoutId="currencyPill"
                className="absolute inset-0 rounded-full"
                style={{ background: "#1B1B3A", zIndex: -1 }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}