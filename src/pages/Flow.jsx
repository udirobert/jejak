import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import Home from "./Home";
import Identifying from "./Identifying";
import Journey from "./Journey";
import MoneySplit from "./MoneySplit";
import DetailDrawer from "@/components/DetailDrawer";
import HowWeEstimateDrawer from "@/components/HowWeEstimateDrawer";

// Orchestrates the main demo flow based on the shared screen state.
export default function Flow() {
  const { screen } = useApp();
  const Current = {
    home: Home,
    identifying: Identifying,
    journey: Journey,
    split: MoneySplit,
  }[screen] || Home;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>
      <DetailDrawer />
      <HowWeEstimateDrawer />
    </>
  );
}