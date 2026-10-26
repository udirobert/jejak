import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Fingerprint, Loader2 } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { signTraceRecord } from "@/lib/wallet";
import { toast } from "sonner";
import JournalButton from "./JournalButton";
import MarginNote from "./MarginNote";

// The passport acting on something.
//
// The app can anchor a trace on its own account. That proves the record
// wasn't edited — it doesn't prove the record is *yours*. This is the
// difference: the passkey signs, and a transaction carrying your key lands
// on the public ledger next to the record.
//
// If there's no passport yet, this says so plainly instead of hiding.
export default function PassportSign({ recordHash, label }) {
  const { walletSession, setWalletSession } = useApp();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!recordHash) return null;

  const sign = async () => {
    setBusy(true);
    setError(null);
    try {
      const session = await signTraceRecord({ recordHash, label });
      setWalletSession(session);
      setResult(session?.passportActions?.[0] || null);
      toast.success("Signed. Your key is on the ledger now.");
    } catch (e) {
      const msg =
        e?.code === "PASSKEY_CANCELLED"
          ? "Signature cancelled — nothing was signed."
          : e?.code === "NOT_CONNECTED"
            ? "Create your passport first."
            : e?.message || "Couldn't sign that right now.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!walletSession) {
    return (
      <div className="mt-3 border border-dashed border-journal-rule bg-journal-paper p-3">
        <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
          Your passport
        </p>
        <p className="mt-1 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
          Create a passport and you can sign this record with your own key, so the ledger shows the
          trace is yours — not just that we wrote it down.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 border border-journal-rule bg-journal-paper p-3">
      <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">
        Your passport signs this too
      </p>

      {result ? (
        <div className="mt-2">
          <p className="font-grotesk text-[13px] leading-relaxed text-journal-ink">
            Signed. Your key is on the public ledger next to the record.
          </p>
          {result.explorerUrl && (
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp underline decoration-journal-stamp/40 underline-offset-2 no-tap hover:text-journal-ink"
            >
              open the transaction
              <ExternalLink size={11} />
            </a>
          )}
          <div className="mt-2">
            <MarginNote tone="stamp">now the record is yours, not just ours</MarginNote>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
            We anchored this on our account, which proves nobody edited it afterwards. Your passkey
            proves it is <em>your</em> trace.
          </p>
          <div className="mt-2.5">
            <JournalButton onClick={sign} disabled={busy} className={busy ? "opacity-60" : ""}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Fingerprint size={13} />}
              {busy ? "Waiting for your fingerprint…" : "Sign this record with my passport"}
            </JournalButton>
          </div>
          {error && (
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp"
            >
              {error}
            </motion.p>
          )}
        </>
      )}
    </div>
  );
}
