import React, { createContext, useContext, useState, useCallback } from "react";
import { hoodie } from "@/data/hoodie";
import { marketForCurrency } from "./money";

const AppContext = createContext(null);

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
  const [shareToFeed, setShareToFeed] = useState(false); // opt-in community feed (off by default)
  const [immersive, setImmersive] = useState(false); // hide tab bar during the trace flow
  const [traces, setTraces] = useState(0);
  const [workerTotal, setWorkerTotal] = useState(0);
  const [distanceTotal, setDistanceTotal] = useState(0);

  const switchCurrency = useCallback((cur) => {
    setCurrency(cur);
    setMarket(marketForCurrency(cur));
  }, []);

  const addTrace = useCallback((labourAmount, distanceKm = 0) => {
    setTraces((n) => n + 1);
    setWorkerTotal((t) => t + (labourAmount || 0));
    setDistanceTotal((d) => d + (distanceKm || 0));
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
    shareToFeed,
    immersive,
    setImmersive,
    traces,
    workerTotal,
    distanceTotal,
    addTrace,
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