import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { formatMoney } from "@/lib/money";
import {
  createWallet,
  connect,
  addRecoverySigner,
  updateSpendingLimitPolicy,
  disconnect,
  isPasskeySupported,
} from "@/lib/wallet";
import {
  CANONICAL_PASSKEY_RP_ID,
  OZ_SMART_ACCOUNT_TESTNET,
  isEmbeddedPreviewIframe,
} from "@/lib/stellarConfig";
import { vibrate } from "@/lib/haptics";
import {
  Fingerprint,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Plus,
  LogOut,
  Wallet,
  Sliders,
} from "lucide-react";

export default function JejakPassportCard({ variant = "bank" }) {
  const { currency, walletSession, setWalletSession } = useApp();
  const [busy, setBusy] = useState(false);
  const [errorState, setErrorState] = useState(null); // { code, message }
  const [showExternal, setShowExternal] = useState(false);
  const [externalInput, setExternalInput] = useState("");
  const [showPolicyConfig, setShowPolicyConfig] = useState(false);

  const isBank = variant === "bank";
  const inIframe = isEmbeddedPreviewIframe();
  const passkeyAvailable = isPasskeySupported();
  const topLevelUrl = `https://${CANONICAL_PASSKEY_RP_ID}${
    isBank ? "/embedded" : "/impact"
  }`;

  const handleCreatePassport = async () => {
    vibrate(8);
    setBusy(true);
    setErrorState(null);
    try {
      const sess = await createWallet({ displayName: "Jejak Passport" });
      setWalletSession(sess);
    } catch (err) {
      setErrorState({
        code: err.code || "UNKNOWN",
        message: err.message || "Could not create passkey wallet.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConnectExistingPasskey = async () => {
    vibrate(6);
    setBusy(true);
    setErrorState(null);
    try {
      const sess = await connect({ mode: "passkey" });
      setWalletSession(sess);
    } catch (err) {
      setErrorState({
        code: err.code || "UNKNOWN",
        message: err.message || "Could not sign in with passkey.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConnectExternal = async (e) => {
    e.preventDefault();
    vibrate(6);
    setBusy(true);
    setErrorState(null);
    try {
      const sess = await connect({
        mode: "external",
        externalAddress: externalInput,
      });
      setWalletSession(sess);
      setShowExternal(false);
    } catch (err) {
      setErrorState({
        code: err.code || "INVALID_EXTERNAL_ADDRESS",
        message: err.message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddRecovery = async () => {
    vibrate(6);
    setBusy(true);
    setErrorState(null);
    try {
      const updated = await addRecoverySigner("Backup recovery signer");
      setWalletSession(updated);
    } catch (err) {
      setErrorState({
        code: err.code || "RELAYER_FAILURE",
        message: err.message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCapChange = async (cap) => {
    vibrate(6);
    setBusy(true);
    setErrorState(null);
    try {
      const updated = await updateSpendingLimitPolicy(cap);
      setWalletSession(updated);
    } catch (err) {
      setErrorState({
        code: err.code || "RELAYER_FAILURE",
        message: err.message,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    vibrate(5);
    disconnect();
    setWalletSession(null);
    setErrorState(null);
  };

  return (
    <div
      className={`rounded-3xl p-4 shadow-sm border ${
        isBank
          ? "bg-white border-slate-200/90 text-slate-900"
          : "frosted-strong border-white/85 text-jejak-navy"
      }`}
    >
      {/* Top Row: Passport Identity + Network Clarity Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-jejak-navy text-amber-300 shadow-sm">
            <Fingerprint size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-extrabold tracking-tight">
                {walletSession ? "Jejak Passport active" : "Jejak Passport"}
              </h3>
              <span className="rounded-full bg-jejak-navy px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 whitespace-nowrap">
                Demo wallet (testnet)
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-semibold opacity-70">
              {walletSession
                ? `OpenZeppelin smart account · Fee-sponsored (0 XLM needed)`
                : "One-step biometric smart account for Bank controls & on-chain history."}
            </p>
          </div>
        </div>

        {walletSession && (
          <button
            type="button"
            onClick={handleDisconnect}
            aria-label="Disconnect Jejak Passport"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 no-tap"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>

      {/* Empty / Disconnected State */}
      {!walletSession && (
        <div className="mt-3 space-y-2.5">
          {inIframe && (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/35 px-3 py-2 text-[11px] font-semibold text-jejak-navy">
              <span>
                Testing biometrics? Passkeys work best in a top-level mobile or
                desktop tab.
              </span>
              <a
                href={topLevelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300"
              >
                Open tab <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* Primary CTA: Biometric Passkey Smart Account */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleCreatePassport}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-jejak-navy px-4 py-2.5 text-xs font-extrabold text-amber-300 shadow-sm hover:opacity-95 disabled:opacity-60 no-tap"
            >
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Waiting for
                  biometrics…
                </>
              ) : (
                <>
                  <Fingerprint size={16} /> Create your Jejak passport
                </>
              )}
            </button>

            {passkeyAvailable && (
              <button
                type="button"
                disabled={busy}
                onClick={handleConnectExistingPasskey}
                className="min-h-[44px] rounded-2xl bg-slate-100 border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-800 hover:bg-slate-200/70 no-tap"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Secondary Fallback CTA: Stellar Wallets Kit / Freighter */}
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                vibrate(4);
                setShowExternal((v) => !v);
              }}
              className="inline-flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2 no-tap"
            >
              <Wallet size={12} /> Connect existing wallet (Freighter / G…
              address)
            </button>
            <span className="font-mono text-[10px] text-slate-400">
              RP: {CANONICAL_PASSKEY_RP_ID}
            </span>
          </div>

          <AnimatePresence>
            {showExternal && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleConnectExternal}
                className="overflow-hidden pt-1 space-y-2"
              >
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={externalInput}
                    onChange={(e) => setExternalInput(e.target.value)}
                    placeholder="Paste Testnet G… or C… address (or leave blank for Freighter)"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-jejak-navy"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white no-tap"
                  >
                    Connect
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Connected State: Address, Recovery Signer (2-of-2 / Backup), and Spending-Limit Policy Demo */}
      {walletSession && (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-100/90 px-3 py-2 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {walletSession.provider === "smart-account-kit"
                  ? "OpenZeppelin Smart Account (Soroban C…)"
                  : walletSession.walletName || "Connected Stellar Wallet"}
              </span>
              <p className="font-mono text-[11px] font-bold text-slate-800 truncate">
                {walletSession.address}
              </p>
            </div>
            {walletSession.explorerUrl && (
              <a
                href={walletSession.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300"
              >
                Sponsored TX <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* Signers + Recovery Key Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <KeyRound size={14} className="text-jejak-freight shrink-0" />
              <div>
                <p className="font-extrabold text-slate-800">
                  {walletSession.signers?.length || 1}{" "}
                  {(walletSession.signers?.length || 1) === 1
                    ? "signer registered"
                    : "signers registered (recovery enabled)"}
                </p>
                <p className="text-[10px] font-semibold text-slate-500">
                  Bound to RP ID: {walletSession.rpId || CANONICAL_PASSKEY_RP_ID}
                </p>
              </div>
            </div>

            {(walletSession.signers?.length || 1) < 2 ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleAddRecovery}
                className="inline-flex items-center gap-1 rounded-xl bg-jejak-navy/10 px-2.5 py-1.5 text-[11px] font-extrabold text-jejak-navy hover:bg-jejak-navy/15 no-tap"
              >
                <Plus size={12} /> Add recovery key
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                <ShieldCheck size={12} /> Recovery active
              </span>
            )}
          </div>

          {/* OpenZeppelin Spending-Limit Policy Demo (Bank context rule) */}
          {walletSession.provider === "smart-account-kit" && (
            <div className="rounded-2xl border border-slate-200/80 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-extrabold text-slate-800">
                    Spending-limit policy ·{" "}
                    {formatMoney(
                      walletSession.spendingLimit?.dailyCapAmount || 25,
                      currency
                    )}
                    /day
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 font-mono truncate">
                    Policy:{" "}
                    {OZ_SMART_ACCOUNT_TESTNET.spendingLimitPolicyContract.slice(
                      0,
                      14
                    )}
                    …
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPolicyConfig((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-700 hover:bg-slate-200 no-tap"
                >
                  <Sliders size={11} /> {showPolicyConfig ? "Done" : "Cap"}
                </button>
              </div>

              <AnimatePresence>
                {showPolicyConfig && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2"
                  >
                    <div className="flex items-center gap-1.5">
                      {[10, 25, 50].map((amt) => {
                        const active =
                          (walletSession.spendingLimit?.dailyCapAmount || 25) ===
                          amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            disabled={busy}
                            onClick={() => handleCapChange(amt)}
                            className={`flex-1 rounded-xl py-1.5 text-[11px] font-extrabold transition-colors no-tap ${
                              active
                                ? "bg-jejak-navy text-amber-300"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {formatMoney(amt, currency)}/day
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Explicit Error States: passkey cancelled, unsupported browser, iframe blocked, RPC failure, relayer failure */}
      <AnimatePresence>
        {errorState && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2.5 flex items-start justify-between gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-[11px] font-semibold text-red-900"
          >
            <div className="flex items-start gap-1.5">
              <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold uppercase text-[9px] tracking-wider block text-red-700">
                  {errorState.code.replace(/_/g, " ")}
                </span>
                <span>{errorState.message}</span>
              </div>
            </div>
            {errorState.code === "IFRAME_BLOCKED" && (
              <a
                href={topLevelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-jejak-navy px-2.5 py-1 text-[10px] font-extrabold text-amber-300"
              >
                Open tab ↗
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}