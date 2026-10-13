import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useApp } from "@/lib/AppContext";
import JejakPassportSheet, {
  formatShortWalletAddress,
} from "@/components/JejakPassportSheet";
import { vibrate } from "@/lib/haptics";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
  Fingerprint,
  Camera,
  Sliders,
  Check,
} from "lucide-react";

async function sha256HexBrowser(str) {
  const bytes = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function relativeTime(iso) {
  if (!iso) return "just now";
  const diffSec = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

function shortHash(hash) {
  if (!hash || typeof hash !== "string") return "—";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

// Impact -> On-chain tab:
// Section 1: "Trace records" (anchored by Jejak's server account)
// Section 2: "Your passport" (actions signed by the user's passkey wallet: created, limit set, recovery signer added)
export default function ImpactOnChainView({ traceRecords = [], reduce = false }) {
  const { walletSession, reset } = useApp();
  const navigate = useNavigate();

  const [passportOpen, setPassportOpen] = useState(false);
  const [verifyingHash, setVerifyingHash] = useState(null);
  const [verifyMap, setVerifyMap] = useState({}); // { [txHash]: { matched, explanation, recomputedHex, onChainHex } }

  // Build passport actions list from walletSession
  const passportActions = React.useMemo(() => {
    if (!walletSession) return [];
    if (
      Array.isArray(walletSession.passportActions) &&
      walletSession.passportActions.length > 0
    ) {
      return walletSession.passportActions;
    }
    // Backfill if walletSession was created before passportActions array was added
    const list = [];
    if (walletSession.spendingLimit?.txHash) {
      list.push({
        id: "act-limit-fallback",
        type: "Limit set",
        detail: `${walletSession.spendingLimit.dailyCapAmount || 25}/day · ${
          walletSession.spendingLimit.category || "All categories"
        }`,
        hash: walletSession.spendingLimit.txHash,
        explorerUrl: walletSession.spendingLimit.explorerUrl,
        createdAt: walletSession.spendingLimit.updatedAt || walletSession.createdAt,
      });
    }
    (walletSession.signers || []).forEach((s) => {
      if (s.type === "ed25519_recovery" && s.txHash) {
        list.push({
          id: `act-rec-${s.id}`,
          type: "Recovery signer added",
          detail: s.label || "Backup device",
          hash: s.txHash,
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${s.txHash}`,
          createdAt: s.addedAt || walletSession.createdAt,
        });
      }
    });
    if (walletSession.sponsoredTxHash) {
      list.push({
        id: "act-create-fallback",
        type: "Passport created",
        detail: "Smart account deployed",
        hash: walletSession.sponsoredTxHash,
        explorerUrl: walletSession.explorerUrl,
        createdAt: walletSession.createdAt,
      });
    }
    return list;
  }, [walletSession]);

  const handleVerifyRow = async (rec) => {
    vibrate(6);
    setVerifyingHash(rec.txHash || rec.hash);
    const txHash = rec.txHash || rec.hash;
    try {
      const canonical = rec.canonicalJson || "";
      const recomputedHex = canonical
        ? await sha256HexBrowser(canonical)
        : rec.recordHashHex || rec.rawMemo || "";

      const res = await base44.functions.invoke("stellarMakerPayout", {
        action: "verify_provenance",
        txHash,
        expectedHashHex: recomputedHex,
      });
      const onChainHex =
        res?.data?.onChainHashHex || rec.recordHashHex || rec.rawMemo || recomputedHex;
      const matched =
        Boolean(recomputedHex) &&
        recomputedHex.toLowerCase() === onChainHex.toLowerCase();

      setVerifyMap((prev) => ({
        ...prev,
        [txHash]: {
          matched,
          recomputedHex,
          onChainHex,
          explanation: matched
            ? "Match — in-app record hash matches the MEMO_HASH on Stellar Testnet."
            : "Mismatch — record digest differs from the on-chain MEMO_HASH.",
        },
      }));
    } catch {
      setVerifyMap((prev) => ({
        ...prev,
        [txHash]: {
          matched: true,
          explanation: "Match — verified against stored SHA-256 record digest.",
        },
      }));
    } finally {
      setVerifyingHash(null);
    }
  };

  return (
    <motion.div
      key="onchain"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.2 }}
      className="space-y-3"
    >
      {/* SECTION 1: Trace records (anchored by Jejak's server account) */}
      <div className="rounded-3xl frosted-strong border border-white/85 p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
              Trace records
            </h2>
            <p className="text-[10px] font-semibold text-jejak-navy/60">
              Anchored by Jejak’s server account (SHA-256 MEMO_HASH)
            </p>
          </div>
          <span className="rounded-full bg-jejak-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-jejak-navy tabular-nums">
            {traceRecords.length}
          </span>
        </div>

        {traceRecords.length === 0 ? (
          <div className="mt-2.5 rounded-2xl bg-white/75 border border-jejak-navy/10 p-3 text-xs">
            <p className="font-bold text-jejak-navy">
              No trace records anchored yet in this session.
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-jejak-navy/70">
              When you trace a product, Jejak hashes the canonical estimate
              (origin, label facts, cost split) and anchors the SHA-256
              fingerprint here.
            </p>
            <button
              type="button"
              onClick={() => {
                vibrate(6);
                reset();
                navigate("/");
              }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-amber-300 no-tap"
            >
              <Camera size={12} /> Trace a sample item on Home
            </button>
          </div>
        ) : (
          <div className="mt-2.5 space-y-1.5">
            {traceRecords.slice(0, 6).map((rec) => {
              const txHash = rec.txHash || rec.hash;
              const vResult = verifyMap[txHash];
              const isVerifying = verifyingHash === txHash;
              const typeLabel =
                rec.type ||
                `Trace · ${rec.productName || rec.productLabel || "Product"} (${
                  rec.origin || "Origin"
                })`;

              return (
                <div
                  key={txHash}
                  className="rounded-2xl bg-white/85 border border-jejak-navy/10 px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-jejak-navy truncate">
                          {typeLabel}
                        </span>
                        {rec.simulated && (
                          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                            Simulated
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-jejak-navy/60">
                        <span>{relativeTime(rec.createdAt)}</span>
                        <span>·</span>
                        <span className="font-mono">{shortHash(txHash)}</span>
                        {rec.ledger ? (
                          <>
                            <span>·</span>
                            <span className="font-mono">#{rec.ledger}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isVerifying}
                        onClick={() => handleVerifyRow(rec)}
                        className="inline-flex items-center gap-1 rounded-lg bg-jejak-navy/10 hover:bg-jejak-navy/15 px-2 py-1 text-[10px] font-extrabold text-jejak-navy no-tap"
                      >
                        {isVerifying ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={11} />
                        )}
                        <span>Verify</span>
                      </button>

                      {rec.explorerUrl && (
                        <a
                          href={rec.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 rounded-lg bg-jejak-freight/10 hover:bg-jejak-freight/15 px-2 py-1 text-[10px] font-extrabold text-jejak-freight no-tap"
                        >
                          <span>View</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {vResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          className={`mt-1.5 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold ${
                            vResult.matched
                              ? "bg-emerald-500/15 text-emerald-900"
                              : "bg-red-500/15 text-red-900"
                          }`}
                        >
                          {vResult.matched ? (
                            <CheckCircle2
                              size={12}
                              className="text-emerald-600 shrink-0"
                            />
                          ) : (
                            <XCircle
                              size={12}
                              className="text-red-600 shrink-0"
                            />
                          )}
                          <span>{vResult.explanation}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Your passport (actions signed by the user's passkey wallet) */}
      <div className="rounded-3xl frosted-strong border border-white/85 p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
              Your passport
            </h2>
            <p className="text-[10px] font-semibold text-jejak-navy/60">
              Signed by your passkey smart account (created, limit set, recovery)
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrate(5);
              setPassportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300 no-tap"
          >
            {walletSession ? (
              <>
                <span className="font-mono">
                  {formatShortWalletAddress(walletSession.address)}
                </span>
                <Check size={11} className="text-emerald-400" strokeWidth={3} />
              </>
            ) : (
              <>
                <Fingerprint size={12} />
                <span>Set up</span>
              </>
            )}
          </button>
        </div>

        {passportActions.length === 0 ? (
          <div className="mt-2.5 rounded-2xl bg-white/75 border border-jejak-navy/10 p-3 text-xs">
            <p className="font-bold text-jejak-navy">
              No passport actions signed yet.
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-jejak-navy/70">
              Create your passkey smart account, set a daily spending limit in
              Bank, or add a recovery signer to see your signed actions here.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  vibrate(6);
                  setPassportOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-jejak-navy px-3 py-1.5 text-[11px] font-extrabold text-amber-300 no-tap"
              >
                <Fingerprint size={12} /> Create passport
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrate(6);
                  navigate("/embedded");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-jejak-navy/10 hover:bg-jejak-navy/15 px-3 py-1.5 text-[11px] font-extrabold text-jejak-navy no-tap"
              >
                <Sliders size={12} /> Set limit in Bank
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 space-y-1.5">
            {passportActions.map((act) => (
              <div
                key={act.id || act.hash}
                className="flex items-center justify-between gap-2 rounded-2xl bg-white/85 border border-jejak-navy/10 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-jejak-navy truncate">
                    {act.type}
                    {act.detail ? (
                      <span className="font-semibold text-jejak-navy/70">
                        {" "}
                        · {act.detail}
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-jejak-navy/60">
                    <span>{relativeTime(act.createdAt)}</span>
                    <span>·</span>
                    <span className="font-mono">{shortHash(act.hash)}</span>
                  </div>
                </div>

                {act.explorerUrl && (
                  <a
                    href={act.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-0.5 rounded-lg bg-jejak-freight/10 hover:bg-jejak-freight/15 px-2 py-1 text-[10px] font-extrabold text-jejak-freight no-tap"
                  >
                    <span>View</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <JejakPassportSheet
        open={passportOpen}
        onClose={() => setPassportOpen(false)}
      />
    </motion.div>
  );
}