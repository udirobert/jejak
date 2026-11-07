import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ScreenShell from "@/components/ScreenShell";
import JournalButton from "@/components/journal/JournalButton";
import MarginNote from "@/components/journal/MarginNote";
import WagerPanel from "@/components/journal/WagerPanel";
import GuessField from "@/components/journal/GuessField";
import { getAnonId } from "@/lib/anonId";
import { poolUrl, setPageMeta, resetPageMeta } from "@/lib/share";
import { useReducedMotion } from "framer-motion";
import { toast } from "sonner";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// The guess-first pool rooms. Pools are keyed by HS code, so this table and
// the word lists inside it are the category itself — the same table the
// backend settles against (imported, not copied, so they can't drift).
import { CATEGORY_LABOUR_MID } from "../../base44/shared/guess.ts";

const CATEGORY_WORDS = {
  "6110": ["hoodie", "sweatshirt", "jumper", "knitwear", "sweater"],
  "6404": ["trainers", "sneakers", "running shoes", "footwear"],
  "090111": ["coffee", "espresso", "specialty coffee", "coffee beans"],
  "392690": ["phone case", "mobile accessories", "cases"],
};

const CATEGORY_NAME = {
  "6110": "Jumpers, sweatshirts & hoodies",
  "6404": "Trainers & sneakers",
  "090111": "Coffee",
  "392690": "Phone cases & accessories",
};

const fmtViews = (n) =>
  n == null ? "" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`;

// A pool you can land in without tracing anything first. The wager couldn't
// acquire anyone who hadn't scanned — this page is the fix, and it's where
// people arrive from a shared link: same field, same truth, no account.
//
// The constitution still holds here: a calibration game about the world, not
// a game about each other. The pot is sponsored; no sign-up; the field shows
// positions, not people.
export default function PublicPool() {
  const { category } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const truth = CATEGORY_LABOUR_MID?.[category];
  const name = CATEGORY_NAME[category];
  const words = CATEGORY_WORDS[category] || [];

  const [poolState, setPoolState] = useState(null); // pool_state response
  const [guessProof, setGuessProof] = useState(null);
  const [poolResult, setPoolResult] = useState(null);
  const [claimState, setClaimState] = useState({ status: "idle" });
  const [guess, setGuess] = useState(8);
  const [committing, setCommitting] = useState(false);
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    if (!name) return;
    setPageMeta({
      title: `Jejak — the field on ${name}`,
      description:
        "Guess what share of the price reaches the people who made it. Your guess goes on a public ledger, then the field is revealed. No account needed.",
      url: poolUrl(category),
    });
    return () => resetPageMeta();
  }, [name, category]);

  // The count is safe before the reveal — the distribution isn't. That lock
  // is what keeps the crowd from being copied, here as in the app flow.
  useEffect(() => {
    if (!truth) return;
    let alive = true;
    base44.functions
      .invoke("guessPool", { action: "pool_state", product_id: category })
      .then((r) => {
        const d = r?.data || r;
        if (alive && d?.ok) setPoolState(d);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [category, truth]);

  // What the internet is currently filming in this category — a liveness
  // line, not evidence. Hidden entirely unless the app brings a conversation
  // of size (a count of one is never shown as a count).
  useEffect(() => {
    if (!words.length) return;
    let alive = true;
    base44.functions
      .invoke("orianeEvidence", { action: "category_pulse", words })
      .then((r) => {
        const d = r?.data || r;
        if (alive && d?.available && d.conversation >= 10) setPulse(d);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [category, words.join("|")]);

  if (!truth || !name) {
    return (
      <ScreenShell>
        <div className="mx-auto mt-16 max-w-md px-5 text-center">
          <p className="font-serif-display text-3xl text-journal-ink" style={displayFont}>
            No room here
          </p>
          <p className="mt-2 font-grotesk text-sm text-journal-ink-soft">
            Pools exist for traced categories. Trace something and its room opens.
          </p>
          <div className="mt-4 flex justify-center">
            <JournalButton onClick={() => navigate("/trace")}>Trace something</JournalButton>
          </div>
        </div>
      </ScreenShell>
    );
  }

  const commitGuess = () => {
    setCommitting(true);
    base44.functions
      .invoke("guessPool", {
        action: "commit",
        product_id: category,
        guess_pct: guess,
        product_name: name,
        anon_id: getAnonId(),
      })
      .then((r) => {
        const data = r?.data || r;
        if (!data?.ok) throw new Error(data?.error || data?.reason || "commit rejected");
        setGuessProof(data);
        return base44.functions.invoke("guessPool", {
          action: "resolve",
          product_id: category,
          // The pool's truth is the category's estimate — the same truth
          // everyone in this field settles against.
          labour_pct: truth,
        });
      })
      .then((r) => {
        const data = r?.data || r;
        if (data?.ok) setPoolResult(data);
      })
      .catch((err) => {
        console.warn("[guessPool] guess-first commit failed:", err);
        toast.error("The ledger commit failed — try again.");
      })
      .finally(() => setCommitting(false));
  };

  const claimPot = () => {
    setClaimState({ status: "claiming" });
    base44.functions
      .invoke("guessPool", { action: "claim", product_id: category, anon_id: getAnonId() })
      .then((r) => {
        const data = r?.data || r;
        if (!data?.ok) throw new Error(data?.reason || data?.error || "claim rejected");
        setClaimState({ status: "claimed", ...data });
        toast.success(`${data.amount || ""} XLM is yours — it's on the ledger.`);
      })
      .catch((err) => {
        setClaimState({
          status: "failed",
          error: err?.message === "nothing_to_claim"
            ? "There's no pot waiting for this browser."
            : err?.message || "The claim didn't go through — try again.",
        });
      });
  };

  const poolSize = poolState?.pool_size ?? 0;

  return (
    <ScreenShell section="The field">
      <div className="mx-auto max-w-xl px-5 pb-12 pt-6 lg:px-10 lg:pt-10">
        <p className="font-plexmono text-[10px] uppercase tracking-[0.18em] text-journal-stamp">
          The wager · no account needed
        </p>
        <h1 className="mt-2 font-serif-display text-4xl leading-[1.05] text-journal-ink md:text-5xl" style={displayFont}>
          {name}
        </h1>
        <p className="mt-3 max-w-md font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
          How much of a jacket's price reaches the people who made it? Guess the share. Your
          guess is committed to a public ledger, then the whole field is revealed against the
          answer.
        </p>

        {poolSize > 0 && !poolResult && (
          <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-stamp">
            {poolSize} {poolSize === 1 ? "person has" : "people have"} already guessed in this room
          </p>
        )}

        {pulse && (
          <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
            this category is in roughly {pulse.conversation.toLocaleString()} indexed videos and
            posts — you're not guessing on trivia
          </p>
        )}

        {!poolResult && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border border-journal-rule bg-journal-card p-5 shadow-[0_10px_30px_-16px_rgba(30,27,22,0.3)]"
          >
            <p className="font-serif-display text-2xl text-journal-ink" style={displayFont}>
              Guess first
            </p>
            {guessProof && (
              <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
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
            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={guess}
              onChange={(e) => setGuess(Number(e.target.value))}
              aria-label="Guess the maker share percent"
              className="mt-4 w-full cursor-pointer accent-journal-stamp"
            />
            <div className="mt-1 flex justify-between font-plexmono text-[10px] text-journal-ink-soft">
              <span>1%</span>
              <span className="font-medium text-journal-stamp">{guess}%</span>
              <span>40%</span>
            </div>
            <div className="mt-4">
              <JournalButton onClick={commitGuess} className={committing ? "opacity-60" : ""}>
                {committing ? "Committing…" : "Commit the guess & reveal"}
              </JournalButton>
            </div>
            <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
              your guess is committed before anyone else's is revealed
            </p>
          </motion.div>
        )}

        {poolResult && !poolResult.settlement && (
          <div className="mt-6 border border-journal-rule bg-journal-card p-5">
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
              The field
            </p>
            <div className="mt-4">
              <GuessField
                fieldPcts={poolResult.field_pcts || []}
                yourPct={poolResult.your_guess_pct}
                actualPct={null}
                estimate={null}
                reduce={reduce}
              />
            </div>
            <p className="mt-3 font-grotesk text-[14px] leading-relaxed text-journal-ink">
              You're the only one in the pool so far. The pot opens when somebody else guesses —
              and it settles against everyone who's in it.
            </p>
          </div>
        )}

        <WagerPanel
          guessProof={guessProof}
          poolResult={poolResult}
          estimate={null}
          claimState={claimState}
          onClaim={claimPot}
          poolKey={category}
          shareUrl={poolUrl(category)}
          reduce={reduce}
          onTraceYours={() => navigate("/trace")}
        />

        {pulse && pulse.items?.length > 0 && (
          <div className="mt-8 border-t border-journal-rule pt-5">
            <p className="font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-stamp">
              What the internet is filming
            </p>
            <MarginNote tone="ink">not evidence — just the conversation, sized</MarginNote>
            <ul className="mt-3 space-y-2">
              {pulse.items.slice(0, 5).map((item, i) => (
                <li key={i} className="border border-journal-rule bg-journal-card p-3">
                  <a
                    href={item.postUrl || item.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-grotesk text-[13px] leading-relaxed text-journal-ink underline decoration-journal-rule underline-offset-2 hover:decoration-journal-stamp"
                  >
                    {item.handle || item.platform}
                    {item.viewsCount != null ? ` · ${fmtViews(item.viewsCount)} views` : ""}
                  </a>
                  <p className="mt-1 line-clamp-2 font-grotesk text-[12px] leading-snug text-journal-ink-soft">
                    {item.caption}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-plexmono text-[9px] uppercase tracking-[0.08em] text-journal-ink-soft">
              volume from public posts · never a stage claim
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-dashed border-journal-rule pt-4">
          <MarginNote tone="ink">
            a calibration game about the world · the pot is sponsored · the field shows positions, not people
          </MarginNote>
        </div>
      </div>
    </ScreenShell>
  );
}
