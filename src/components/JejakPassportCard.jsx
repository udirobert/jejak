import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import JejakPassportSheet, {
  formatShortWalletAddress,
} from "./JejakPassportSheet";
import { vibrate } from "@/lib/haptics";
import { Fingerprint, Check } from "lucide-react";

// Compact on-demand trigger for Impact -> On-chain (opens the same clean sheet)
export default function JejakPassportCard() {
  const { walletSession } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const shortAddr = formatShortWalletAddress(walletSession?.address);

  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-2xl frosted-strong border border-white/85 px-3.5 py-2.5">
        <span className="text-xs font-extrabold text-jejak-navy">
          Jejak Passport
        </span>
        <button
          type="button"
          onClick={() => {
            vibrate(5);
            setSheetOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-jejak-navy px-3 py-1 text-xs font-extrabold text-amber-300 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy"
        >
          {walletSession ? (
            <>
              <span className="font-mono text-[11px]">{shortAddr}</span>
              <Check size={12} className="text-emerald-400" strokeWidth={3} />
            </>
          ) : (
            <>
              <Fingerprint size={13} />
              <span>Passport · Set up</span>
            </>
          )}
        </button>
      </div>

      <JejakPassportSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}