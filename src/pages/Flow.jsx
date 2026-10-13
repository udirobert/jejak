import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { pageVariants, SPRING } from "@/lib/motion";
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
  const Current = {
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

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={SPRING}
        >
          <Current />
        </motion.div>
      </AnimatePresence>
      <DetailDrawer />
      <HowWeEstimateDrawer />
      <Onboarding />
    </>
  );
}