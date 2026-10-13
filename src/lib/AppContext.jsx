import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { hoodie } from "@/data/hoodie";
import { marketForCurrency, getRoute } from "./money";
import { base44 } from "@/api/base44Client";

const AppContext = createContext(null);
const STREAK_STORAGE_KEY = "jejak_streak_v1";

function loadSavedStreak() {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return { traces: 0, workerTotal: 0, distanceTotal: 0, origins: [] };
    const parsed = JSON.parse(raw);
    return {
      traces: Number(parsed.traces) || 0,
      workerTotal: Number(parsed.workerTotal) || 0,
      distanceTotal: Number(parsed.distanceTotal) || 0,
      origins: Array.isArray(parsed.origins) ? parsed.origins : [],
    };
  } catch {
    return { traces: 0, workerTotal: 0, distanceTotal: 0, origins: [] };
  }
}

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState("GBP"); // 'GBP' | 'SGD'
  const [market, setMarket] = useState("GB"); // 'GB' | 'SG'
  const [product, setProduct] = useState(hoodie);
  const [photo, setPhoto] = useState(null); // display URL (object URL or data URL)
  const [photoFile, setPhotoFile] = useState(null); // raw File, kept for optional public share
  const [photoUrl, setPhotoUrl] = useState(null); // signed URL used for recognition
  const [screen, setScreen] = useState("home"); // home | identifying | journey | split
  const [compareMode, setCompareMode] = useState(false);
  const [detailCategory, setDetailCategory] = useState(null); // category key
  const [showHowTo, setShowHowTo] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  // Privacy-first sharing mode: 'private' (default) | 'count' (anonymous tally only) | 'feed' (card + photo)
  const [shareMode, setShareMode] = useState("private");
  const shareToFeed = shareMode !== "private";
  const setShareToFeed = useCallback((val) => {
    setShareMode(val ? "feed" : "private");
  }, []);
  const [immersive, setImmersive] = useState(false); // hide tab bar during the trace flow
  const initialStreak = loadSavedStreak();
  const [traces, setTraces] = useState(initialStreak.traces);
  const [workerTotal, setWorkerTotal] = useState(initialStreak.workerTotal);
  const [distanceTotal, setDistanceTotal] = useState(initialStreak.distanceTotal);
  const [origins, setOrigins] = useState(initialStreak.origins);
  const [customPrice, setCustomPrice] = useState(null); // optional user-adjusted shelf price
  const [makerTip, setMakerTip] = useState(0); // optional direct maker boost on current receipt
  const [guessedLabourPct, setGuessedLabourPct] = useState(null); // pre-reveal user guess
  const [tourStep, setTourStep] = useState(null); // null | 0..3 interactive guided tour
  const [lastStellarTx, setLastStellarTx] = useState(null);
  const [stellarLoading, setStellarLoading] = useState(false);
  const [stellarError, setStellarError] = useState(null);
  const [labelEvidence, setLabelEvidence] = useState(null); // extracted care/Made-in label facts
  const [provenanceRecord, setProvenanceRecord] = useState(null); // anchored SHA-256 provenance record

  const settleStellarPayout = useCallback(
    async ({
      amount,
      productObj,
      currencyOverride,
      mode = "direct",
      causeObj = null,
    }) => {
      const targetProd = productObj || product;
      const cur = currencyOverride || currency;
      const mkt = marketForCurrency(cur);
      const route = getRoute(targetProd, mkt);
      const origin = causeObj?.region || route[0]?.country || "Bangladesh";

      setStellarLoading(true);
      setStellarError(null);
      try {
        const res = await base44.functions.invoke("stellarMakerPayout", {
          action: "settle",
          productId: targetProd?.id || "hoodie",
          origin,
          region: origin,
          causeId: causeObj?.id,
          causeName: causeObj?.name,
          walletAddress: causeObj?.walletAddress,
          amount,
          currency: cur,
          mode,
        });
        if (res?.data?.ok) {
          setLastStellarTx(res.data);
          return res.data;
        }
        throw new Error(res?.data?.error || "Relay error");
      } catch {
        const fallback = lastStellarTx || {
          ok: true,
          cachedFallback: true,
          fallbackNotice:
            "Testnet is slow right now — here is a recent verified testnet transaction.",
          network: "Stellar Testnet",
          mode,
          hash: "d1a60c45d14ad388bcfc4f6194e8bec19fd01035a903e6e81e7181f0ee3caa43",
          ledger: 5180408,
          memo: `CAUSE:${(targetProd?.id || "HOODIE").toUpperCase().slice(0, 8)}:${origin.toUpperCase().slice(0, 11)}`,
          causeName: causeObj?.name || `Demo cause · ${origin} (testnet)`,
          causeLabel: "Demo cause (testnet)",
          disclaimer: "Demo testnet donation. No real-world disbursement.",
          fiatAmount: amount,
          fiatCurrency: cur,
          xlmSettled: +(Number(amount) * 2).toFixed(2),
          feeXlm: "0.00001",
          explorerUrl:
            "https://stellar.expert/explorer/testnet/tx/d1a60c45d14ad388bcfc4f6194e8bec19fd01035a903e6e81e7181f0ee3caa43",
          accountExplorerUrl:
            `https://stellar.expert/explorer/testnet/account/${causeObj?.walletAddress || "GCHJR2K3HXX55NYA7ZYWZH6NZ3TOBTIQFUVZWPUZESAQJ2QFGX5PKVDC"}`,
        };
        setLastStellarTx({ ...fallback, cachedFallback: true });
        return fallback;
      } finally {
        setStellarLoading(false);
      }
    },
    [product, currency, lastStellarTx]
  );

  const startGuidedTour = useCallback(() => {
    setScreen("home");
    setShowHowTo(false);
    setTourStep(0);
  }, []);

  const endGuidedTour = useCallback(() => {
    setTourStep(null);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STREAK_STORAGE_KEY,
        JSON.stringify({ traces, workerTotal, distanceTotal, origins })
      );
    } catch {}
  }, [traces, workerTotal, distanceTotal, origins]);

  const switchCurrency = useCallback((cur) => {
    setCurrency(cur);
    setMarket(marketForCurrency(cur));
    setCustomPrice(null);
  }, []);

  const addTrace = useCallback((labourAmount, distanceKm = 0, originCountry = null) => {
    setTraces((n) => n + 1);
    setWorkerTotal((t) => t + (labourAmount || 0));
    setDistanceTotal((d) => d + (distanceKm || 0));
    if (originCountry) {
      setOrigins((prev) => (prev.includes(originCountry) ? prev : [...prev, originCountry]));
    }
  }, []);

  const addToWorkerFund = useCallback((amount = 0) => {
    setWorkerTotal((t) => t + (amount || 0));
  }, []);

  const reset = useCallback(() => {
    setScreen("home");
    setPhoto(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setCompareMode(false);
    setDetailCategory(null);
    setShowHowTo(false);
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
    setGuessedLabourPct(null);
    setLastStellarTx(null);
    setStellarError(null);
    setLabelEvidence(null);
    setProvenanceRecord(null);
  }, []);

  const value = {
    currency,
    market,
    product,
    photo,
    photoFile,
    photoUrl,
    screen,
    compareMode,
    detailCategory,
    showHowTo,
    lowConfidence,
    shareMode,
    setShareMode,
    shareToFeed,
    immersive,
    setImmersive,
    traces,
    workerTotal,
    distanceTotal,
    origins,
    customPrice,
    setCustomPrice,
    makerTip,
    setMakerTip,
    guessedLabourPct,
    setGuessedLabourPct,
    tourStep,
    setTourStep,
    startGuidedTour,
    endGuidedTour,
    lastStellarTx,
    setLastStellarTx,
    stellarLoading,
    stellarError,
    settleStellarPayout,
    labelEvidence,
    setLabelEvidence,
    provenanceRecord,
    setProvenanceRecord,
    addTrace,
    addToWorkerFund,
    setCurrency: switchCurrency,
    setMarket,
    setProduct,
    setPhoto,
    setPhotoFile,
    setPhotoUrl,
    setScreen,
    setCompareMode,
    setDetailCategory,
    setShowHowTo,
    setLowConfidence,
    setShareToFeed,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}