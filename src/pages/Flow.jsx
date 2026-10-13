import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import Home from "./Home";
import Identifying from "./Identifying";
import Journey from "./Journey";
import MoneySplit from "./MoneySplit";
import DetailDrawer from "@/components/DetailDrawer";
import HowWeEstimateDrawer from "@/components/HowWeEstimateDrawer";
import Onboarding from "@/components/Onboarding";

// Orchestrates the main demo flow based on the shared screen state.
export default function Flow() {
  const { screen, setImmersive } = useApp();
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
      <motion.div
        key={screen}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full"
      >
        <Current />
      </motion.div>
      <DetailDrawer />
      <HowWeEstimateDrawer />
      <Onboarding />
    </>
  );
}