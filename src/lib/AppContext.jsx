import React, { createContext, useContext, useState, useCallback } from "react";
import { hoodie } from "@/data/hoodie";
import { marketForCurrency } from "./money";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState("GBP"); // 'GBP' | 'SGD'
  const [market, setMarket] = useState("GB"); // 'GB' | 'SG'
  const [product, setProduct] = useState(hoodie);
  const [photo, setPhoto] = useState(null); // display URL (object URL or data URL)
  const [photoUrl, setPhotoUrl] = useState(null); // uploaded public URL used for recognition
  const [screen, setScreen] = useState("home"); // home | identifying | journey | split
  const [compareMode, setCompareMode] = useState(false);
  const [detailCategory, setDetailCategory] = useState(null); // category key
  const [showHowTo, setShowHowTo] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);

  const switchCurrency = useCallback((cur) => {
    setCurrency(cur);
    setMarket(marketForCurrency(cur));
  }, []);

  const reset = useCallback(() => {
    setScreen("home");
    setPhoto(null);
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
    photoUrl,
    screen,
    compareMode,
    detailCategory,
    showHowTo,
    lowConfidence,
    setCurrency: switchCurrency,
    setMarket,
    setProduct,
    setPhoto,
    setPhotoUrl,
    setScreen,
    setCompareMode,
    setDetailCategory,
    setShowHowTo,
    setLowConfidence,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}