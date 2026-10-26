import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Loader2, Share2 } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { traceUrl } from "@/lib/share";
import { toast } from "sonner";
import GuessField from "./GuessField";
import JournalButton from "./JournalButton";
import MarginNote from "./MarginNote";

// The wager.
//
// Your guess goes into the ledger as a hash before the real number is known,
// so nobody — including us — can move it afterwards. When the pool settles,
// the field is revealed: where everyone stood, where you stood, and what the
// trade data thought.
//
// Two things this panel is careful about:
//
// - It never says you staked anything. The pot is sponsored by Jejak, so the
//   words "stake" and "your XLM" would be a lie.
// - It never attributes a belief to a person. You see the shape of what
//   people thought, not who thought what.
export default function WagerPanel({
  guessProof,
  poolResult,
  estimate,
  claimState,
  onClaim,
  reduce: reduceProp,
}) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceProp ?? reduceMotion;
  const { savedScanId } = useApp();
  const [shared, setShared] = useState(false);

  if (!guessProof && !poolResult) return null;

  const settlement = poolResult?.settlement || null;
  const field = Array.isArray(poolResult?.field_pcts) ? poolResult.field_pcts : [];
  const poolSize = poolResult?.pool_size ?? field.length;
  const yourPct = poolResult?.your_guess_pct ?? null;
  const actualPct = poolResult?.actual_labour_pct ?? null;
  const median = poolResult?.median_guess_pct ?? null;
  const guessedHigher = poolResult?.guessed_higher ?? null;
  const youWon = Boolean(settlement?.you_won);
  const contested = Boolean(settlement?.contested);
  // The pot is still open: not enough people have guessed to settle it.
  const waiting = Boolean(poolResult?.waiting);

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Where you sat, said plainly.
  let standing = null;
  if (youWon) {
    standing = contested
      ? `You were the closest — ${plural(poolSize, "person", "people")} guessed and you were right.`
      : "You were the only one in the pool, so the pot was yours uncontested.";
  } else if (settlement) {
    standing = `The closest was ${settlement.guess_pct}% — you were ${settlement.error_pct} ${
      settlement.error_pct === 1 ? "point" : "points"
    } off.`;
  } else if (waiting) {
    standing = `You're the only one in the pool. The pot opens when somebody else guesses — and it settles against everyone who's in it.`;
  }

  // The one thing that makes this a wager rather than a note to yourself.
  const askForCompany = async () => {
    const url = traceUrl(savedScanId);
    const text = `I traced a hoodie and guessed what share of the price reached the makers. Beat me — your guess goes in the same pool: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Jejak — beat my guess", text });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        toast.success("Copied — send it to someone.");
        setTimeout(() => setShared(false), 2200);
      }
    } catch {
      // cancelled
    }
  };

  return (
    <div className="mt-4 max-w-md border border-journal-rule bg-journal-card p-4">
      <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
        The wager
      </p>

      {/* the commit — proof the guess was locked before the answer */}
      {guessProof?.explorer_url && (
        <p className="mt-1.5 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
          Your guess went into the ledger first ·{" "}
          <a
            href={guessProof.explorer_url}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-journal-stamp/40 underline-offset-2 hover:text-journal-stamp"
          >
            sha:{String(guessProof.guess_hash || "").slice(0, 12)}…
          </a>
        </p>
      )}

      {/* the field */}
      <div className="mt-4">
        <GuessField
          fieldPcts={field}
          yourPct={yourPct}
          actualPct={actualPct}
          estimate={estimate}
          reduce={reduce}
        />
      </div>

      {/* where you stand */}
      {poolResult && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4 border-t border-dotted border-journal-rule pt-3"
        >
          {standing && (
            <p className="font-grotesk text-[14px] leading-relaxed text-journal-ink">{standing}</p>
          )}

          {poolSize > 1 && guessedHigher != null && (
            <p className="mt-1.5 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
              {plural(guessedHigher, "person", "people")} guessed higher than you
              {median != null ? `; the middle of the field was ${median}%` : ""}.
            </p>
          )}

          {poolSize === 1 && !waiting && (
            <p className="mt-1.5 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
              One guess in the pool so far — you're the first.
            </p>
          )}

          {/* No sign-up is needed to compete — a guess without an account is bound
            to a browser-local id instead, and stays unattributed to
            everyone else. */}

          {/* The one action that makes this a wager and not a note to
              yourself: get somebody else into the pool. */}
          {waiting && (
            <div className="mt-3">
              <JournalButton onClick={askForCompany}>
                <Share2 size={13} /> {shared ? "Copied — send it on" : "Get someone to beat me"}
              </JournalButton>
            </div>
          )}
        </motion.div>
      )}

      {/* the pot */}
      {settlement && (
        <div className="mt-4 border-t border-dotted border-journal-rule pt-3">
          {youWon && settlement.claim_balance_id ? (
            <>
              <p className="font-grotesk text-[14px] leading-relaxed text-journal-ink">
                {settlement.pot_xlm} XLM is waiting for you — a claimable balance, so it's yours to
                collect and nobody else's.
              </p>
              <div className="mt-3">
                {claimState?.status === "claimed" ? (
                  <p className="font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-materials">
                    claimed ·{" "}
                    <a
                      href={claimState.explorer_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-journal-materials/40 underline-offset-2"
                    >
                      open the transaction
                    </a>
                  </p>
                ) : (
                  <JournalButton
                    onClick={onClaim}
                    disabled={claimState?.status === "claiming"}
                    className={claimState?.status === "claiming" ? "opacity-60" : ""}
                  >
                    {claimState?.status === "claiming" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : null}
                    {claimState?.status === "claiming" ? "Claiming…" : `Claim the ${settlement.pot_xlm} XLM`}
                  </JournalButton>
                )}
              </div>
              {claimState?.status === "failed" && (
                <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp">
                  {claimState.error || "the claim didn't go through — try again."}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
                The pot went to the closest guess — {settlement.pot_xlm} XLM, as a claimable balance
                on the test network.
              </p>
              {settlement.settle_explorer && (
                <a
                  href={settlement.settle_explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp underline decoration-journal-stamp/40 underline-offset-2 hover:text-journal-ink"
                >
                  open the settlement
                  <ExternalLink size={11} />
                </a>
              )}
            </>
          )}

          <div className="mt-2.5">
            <MarginNote tone="ink">sponsored pot · no XLM of yours was staked</MarginNote>
          </div>
        </div>
      )}
    </div>
  );
}
