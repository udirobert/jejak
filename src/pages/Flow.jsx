import React, { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { getProduct } from "@/data";
import Home from "./Home";
import Identifying from "./Identifying";
import Journey from "./Journey";
import MoneySplit from "./MoneySplit";
import DetailDrawer from "@/components/DetailDrawer";
import HowWeEstimateDrawer from "@/components/HowWeEstimateDrawer";

// Orchestrates the main demo flow based on the shared screen state.
export default function Flow() {
  const {
    screen,
    setImmersive,
    setProduct,
    setPhoto,
    setPhotoFile,
    setPhotoUrl,
    setLowConfidence,
    setCustomPrice,
    setMakerTip,
    setScreen,
  } = useApp();
  const [searchParams] = useSearchParams();
  const deepLinked = useRef(false);
  const reduce = useReducedMotion();

  // Deep link: /trace?sample=<id> jumps straight into that specimen's flow.
  useEffect(() => {
    if (deepLinked.current) return;
    const sample = searchParams.get("sample");
    const p = sample && getProduct(sample);
    if (!p) return;
    deepLinked.current = true;
    setProduct(p);
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
    setPhoto(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setScreen("identifying");
  }, [searchParams]);
  const Current =
    {
      home: Home,
      identifying: Identifying,
      journey: Journey,
      split: MoneySplit,
    }[screen] || Home;

  // Tell the layout to hide the tab bar during the immersive trace flow.
  useEffect(() => {
    setImmersive(screen !== "home");
    return () => setImmersive(false);
  }, [screen, setImmersive]);

  // Scroll to top whenever switching screens in the flow
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? false : { opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full flex-1 flex flex-col"
        >
          <Current />
        </motion.div>
      </AnimatePresence>
      <DetailDrawer />
      <HowWeEstimateDrawer />
    </>
  );
}