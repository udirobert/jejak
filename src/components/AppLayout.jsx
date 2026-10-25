import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import TabBar from "@/components/TabBar";

// Persistent layout for the tabbed routes — keeps the TabBar mounted across
// route changes and provides smooth editorial page transitions.
export default function AppLayout() {
  const { immersive } = useApp();
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? false : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onAnimationStart={() => {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          }}
          className="flex flex-1 min-h-screen h-full w-full flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {!immersive && <TabBar key="tabbar" />}
      </AnimatePresence>
    </>
  );
}
