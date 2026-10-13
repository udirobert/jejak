import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { hoodie } from "@/data/hoodie";
import { marketForCurrency } from "./money";

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