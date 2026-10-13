import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import {
  createWallet,
  connect,
  addRecoverySigner,
  updateSpendingLimitPolicy,
  disconnect,
} from "@/lib/wallet";
import {
  CANONICAL_PASSKEY_RP_ID,
  isEmbeddedPreviewIframe,
} from "@/lib/stellarConfig";
import Logo from "@/components/Logo";
import { vibrate, coinClink } from "@/lib/haptics";
import {
  Fingerprint,
  Check,
  X,
  Loader2,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Plus,
  LogOut,
} from "lucide-react";

export function formatShortWalletAddress(address) {
  if (!address || typeof address !== "string") return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function shortErrorMessage(code) {
  switch (code) {
    case "PASSKEY_CANCELLED":
      return "Passkey prompt was cancelled.";
    case "UNSUPPORTED_BROWSER":
      return "Passkeys aren't supported in this browser.";
    case "IFRAME_BLOCKED":
      return "Passkeys are blocked in this preview frame.";
    case "RPC_FAILURE":
      return "Couldn't reach Stellar Testnet right now.";
    case "RELAYER_FAILURE":
    case "RATE_LIMITED":
      return "Fee sponsor is busy. Try again in a moment.";
    case "INVALID_EXTERNAL_ADDRESS":
      return "Enter a valid Stellar address.";
    default:
      return "Couldn't complete request.";
  }
}

export default function JejakPassportSheet({
  open,
  onClose,
  pendingActionLabel = null,
}) {
  const { currency, walletSession, setWalletSession } = useApp();
  const reduce = useReducedMotion();

  const [busyAction, setBusyAction] = useState(null); // 'create' | 'signin' | 'external' | 'cap' | 'recovery'
  const [lastAttempt, setLastAttempt] = useState("create");
  const [errorState, setErrorState] = useState(null); // { code, message }
  const [showExternalInput, setShowExternalInput] = useState(false);
  const [externalInput, setExternalInput] = useState("");
  const [celebrating, setCelebrating] = useState(false);

  const topLevelUrl = `https://${CANONICAL_PASSKEY_RP_ID}/embedded`;

  const triggerSuccessDelight = (newSession) => {
    setWalletSession(newSession);
    vibrate([0, 12, 35, 18]);
    coinClink();
    if (reduce) {
      onClose?.();
      return;
    }
    setCelebrating(true);
    setTimeout(() => {
      setCelebrating(false);
      onClose?.();
    }, 850);
  };

  const handleCreate = async () => {
    vibrate(8);
    setLastAttempt("create");
    setBusyAction("create");
    setErrorState(null);
    try {
      const sess = await createWallet({ displayName: "Jejak Passport" });
      triggerSuccessDelight(sess);
    } catch (err) {
      const code =
        err.code || (isEmbeddedPreviewIframe() ? "IFRAME_BLOCKED" : "UNKNOWN");
      setErrorState({ code, message: shortErrorMessage(code) });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignIn = async () => {
    vibrate(6);
    setLastAttempt("signin");
    setBusyAction("signin");
    setErrorState(null);
    try {
      const sess = await connect({ mode: "passkey" });
      triggerSuccessDelight(sess);
    } catch (err) {
      const code =
        err.code || (isEmbeddedPreviewIframe() ? "IFRAME_BLOCKED" : "UNKNOWN");
      setErrorState({ code, message: shortErrorMessage(code) });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConnectExternal = async (e) => {
    e.preventDefault();
    vibrate(6);
    setLastAttempt("external");
    setBusyAction("external");
    setErrorState(null);
    try {
      const sess = await connect({
        mode: "external",
        externalAddress: externalInput,
      });
      triggerSuccessDelight(sess);
      setShowExternalInput(false);
    } catch (err) {
      const code = err.code || "INVALID_EXTERNAL_ADDRESS";
      setErrorState({ code, message: shortErrorMessage(code) });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRetry = () => {
    if (lastAttempt === "signin") handleSignIn();
    else if (lastAttempt === "external")
      handleConnectExternal({ preventDefault: () => {} });
    else handleCreate();
  };

  const handleCapSelect = async (amt) => {
    vibrate(6);
    setBusyAction("cap");
    setErrorState(null);
    try {
      const updated = await updateSpendingLimitPolicy(amt);
      setWalletSession(updated);
    } catch (err) {
      setErrorState({
        code: err.code || "RELAYER_FAILURE",
        message: shortErrorMessage(err.code || "RELAYER_FAILURE"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddRecovery = async () => {
    vibrate(6);
    setBusyAction("recovery");
    setErrorState(null);
    try {
      const updated = await addRecoverySigner("Backup device");
      setWalletSession(updated);
    } catch (err) {
      setErrorState({
        code: err.code || "RELAYER_FAILURE",
        message: shortErrorMessage(err.code || "RELAYER_FAILURE"),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = () => {
    vibrate(5);
    disconnect();
    setWalletSession(null);
    setErrorState(null);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Your Jejak passport"
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full max-w-[420px] rounded-t-3xl bg-white border-t border-slate-200 px-5 pt-4 pb-8 shadow-2xl text-slate-900"
          >
            {/* Drag bar */}
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />

            {/* Top tag + Close button */}
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                Demo wallet (testnet)
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close passport sheet"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 no-tap"
              >
                <X size={15} />
              </button>
            </div>

            {/* Celebration state: Fingerprint -> J-coin with gold ring pulse */}
            {celebrating ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {!reduce && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0.9 }}
                      animate={{ scale: 1.65, opacity: 0 }}
                      transition={{ duration: 0.75, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 rounded-full border-2 border-amber-400"
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 360, damping: 20 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-jejak-navy shadow-lg ring-4 ring-amber-300/60"
                  >
                    <Logo size={42} />
                  </motion.div>
                </div>
                <p className="mt-3 text-base font-extrabold text-slate-900">
                  Passport ready
                </p>
              </div>
            ) : !walletSession ? (
              /* Disconnected State: Minimal copy + 1 primary button + 2 small text links */
              <div className="mt-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  Your Jejak passport
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {pendingActionLabel || "Unlock spending limits with Face ID"}
                </p>

                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={handleCreate}
                  className="mt-4 w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-2xl bg-jejak-navy px-4 py-3 text-xs font-extrabold text-amber-300 shadow-sm hover:opacity-95 disabled:opacity-60 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy"
                >
                  {busyAction === "create" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <Fingerprint size={16} /> Create passport
                    </>
                  )}
                </button>

                {/* Two small text links */}
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={handleSignIn}
                    className="font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 no-tap"
                  >
                    Already have one? Sign in
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={() => {
                      vibrate(4);
                      setShowExternalInput((v) => !v);
                    }}
                    className="font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2 no-tap"
                  >
                    Use an existing wallet
                  </button>
                </div>

                <AnimatePresence>
                  {showExternalInput && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleConnectExternal}
                      className="overflow-hidden pt-2.5"
                    >
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={externalInput}
                          onChange={(e) => setExternalInput(e.target.value)}
                          placeholder="Stellar address (or leave blank for Freighter)"
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-jejak-navy"
                        />
                        <button
                          type="submit"
                          disabled={Boolean(busyAction)}
                          className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-white no-tap"
                        >
                          Connect
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Connected State: Simple controls for Daily Cap + Recovery Device */
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Your Jejak passport
                    </h2>
                    <p className="font-mono text-xs font-bold text-slate-500">
                      {formatShortWalletAddress(walletSession.address)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                    <Check size={12} strokeWidth={2.5} /> Active
                  </span>
                </div>

                {/* Daily spending limit selector */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Daily spending limit
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatMoney(
                        walletSession.spendingLimit?.dailyCapAmount || 25,
                        currency
                      )}
                      /day
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {[10, 25, 50].map((amt) => {
                      const active =
                        (walletSession.spendingLimit?.dailyCapAmount || 25) ===
                        amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          disabled={Boolean(busyAction)}
                          onClick={() => handleCapSelect(amt)}
                          className={`rounded-xl py-2 text-xs font-extrabold transition-colors no-tap ${
                            active
                              ? "bg-jejak-navy text-amber-300"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {formatMoney(amt, currency)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recovery device + Disconnect */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {(walletSession.signers?.length || 1) < 2 ? (
                    <button
                      type="button"
                      disabled={Boolean(busyAction)}
                      onClick={handleAddRecovery}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-200 no-tap"
                    >
                      <Plus size={13} /> Add recovery device
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <ShieldCheck size={14} /> Recovery device added
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 no-tap"
                  >
                    <LogOut size={13} /> Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* Single-line error state + Retry button (plus top-level tab link only on failure/iframe) */}
            <AnimatePresence>
              {errorState && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs">
                    <span className="font-semibold text-red-800 truncate">
                      {errorState.message}
                    </span>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-extrabold text-red-900 hover:bg-red-200 no-tap"
                    >
                      <RotateCcw size={11} /> Retry
                    </button>
                  </div>

                  {(errorState.code === "IFRAME_BLOCKED" ||
                    isEmbeddedPreviewIframe()) && (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
                      <span>Passkeys work best in a top-level tab.</span>
                      <a
                        href={topLevelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 font-extrabold text-jejak-navy underline"
                      >
                        Open tab <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}