import React from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import TabBar from "@/components/TabBar";

// Persistent layout for the tabbed routes — keeps the TabBar mounted across
// route changes so its active indicator slides, and hides it during the
// immersive trace flow (identifying/journey/split).
export default function AppLayout() {
  const { immersive } = useApp();
  return (
    <>
      <Outlet />
      <AnimatePresence>
        {!immersive && <TabBar key="tabbar" />}
      </AnimatePresence>
    </>
  );
}