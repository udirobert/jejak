import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ScreenShell from "@/components/ScreenShell";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { PRODUCTS, getProduct } from "@/data";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { Camera, X, Sparkles } from "lucide-react";
import ExploreFullBleedMap from "@/components/explore/ExploreFullBleedMap";
import ExploreBottomSheet, {
  SNAP_HEIGHTS,
} from "@/components/explore/ExploreBottomSheet";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";
import { isSampleScan } from "@/components/explore/exploreUtils";

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [originFilter, setOriginFilter] = useState("All");
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  // Default state is collapsed peek: handle + one line ("N traced products"). Never auto-expand on load.
  const [snap, setSnap] = useState("peek");
  const [newlyArrivedId, setNewlyArrivedId] = useState(null);
  const [arcOrigin, setArcOrigin] = useState(null);
  const [loading, setLoading] = useState(true);

  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const { setProduct, setScreen, setCompareMode, setLowConfidence, reset } =
    useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Scan.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      const items = page.items || [];
      setScans(items);
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Clear arrival arc after animation finishes
  useEffect(() => {
    if (!arcOrigin) return;
    const t = setTimeout(() => setArcOrigin(null), 2400);
    return () => clearTimeout(t);
  }, [arcOrigin]);

  // Live subscription: when a new real trace arrives, pulse the peek line and animate an arc from its origin dot (never auto-expand)
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      setNewlyArrivedId(s.id);
      if (s.origin && !isSampleScan(s)) {
        setArcOrigin(s.origin);
      }
      setScans((prev) =>
        prev.some((p) => p.id === s.id) ? prev : [s, ...prev]
      );
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!newlyArrivedId) return;
    const t = setTimeout(() => setNewlyArrivedId(null), 3200);
    return () => clearTimeout(t);
  }, [newlyArrivedId]);

  // Origin chips: seeded traces are NOT counted as live (real)
  const originChips = useMemo(() => {
    const map = new Map();
    scans.forEach((s) => {
      const o = s.origin || "Bangladesh";
      const prev = map.get(o) || { origin: o, total: 0, real: 0 };
      prev.total += 1;
      if (!isSampleScan(s)) prev.real += 1;
      map.set(o, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scans]);

  const filteredScans = useMemo(() => {
    if (originFilter === "All") return scans;
    return scans.filter((s) => s.origin === originFilter);
  }, [scans, originFilter]);

  // Deduplicated product groups — each product appears ONCE in newest-first order
  const productGroups = useMemo(() => {
    const groups = new Map();
    filteredScans.forEach((s) => {
      const pid = s.product_id || "hoodie";
      if (!groups.has(pid)) {
        groups.set(pid, []);
      }
      groups.get(pid).push(s);
    });
    return Array.from(groups.entries()).map(([productId, items]) => ({
      productId,
      lead: items[0],
      items,
    }));
  }, [filteredScans]);

  const untracedProducts = useMemo(() => {
    if (originFilter !== "All") return [];
    const tracedIds = new Set(scans.map((s) => s.product_id));
    return PRODUCTS.filter((p) => !tracedIds.has(p.id));
  }, [scans, originFilter]);

  // Tapping a dot opens the sheet to half height, filtered to that origin.
  const handleSelectOrigin = (origin) => {
    if (origin === "All") {
      setOriginFilter("All");
      return;
    }
    setOriginFilter(origin);
    setArcOrigin(origin);
    setSnap("half");
  };

  // Tapping empty map collapses the sheet to peek
  const handleEmptyMapTap = () => {
    if (snap !== "peek") {
      vibrate(4);
      setSnap("peek");
    }
  };

  const handleTraceProduct = (productId) => {
    vibrate(8);
    const prod = getProduct(productId) || getProduct("hoodie");
    setProduct(prod);
    setCompareMode(false);
    setLowConfidence(false);
    setScreen("journey");
    navigate("/");
  };

  const handleTraceYours = () => {
    vibrate(8);
    reset();
    navigate("/");
  };

  // Camera button floats right above the current sheet height (above peek on load) and never overlaps sheet content
  const sheetHeightPx = SNAP_HEIGHTS[snap] || SNAP_HEIGHTS.peek;

  return (
    <ScreenShell variant="map">
      <div className="relative flex-1 h-full w-full overflow-hidden">
        {/* Full-bleed Rich Indigo/Teal Interactive Map Background */}
        <ExploreFullBleedMap
          originChips={originChips}
          originFilter={originFilter}
          onSelectOrigin={handleSelectOrigin}
          onEmptyMapTap={handleEmptyMapTap}
          onOpenInfo={() => setShowInfoSheet(true)}
          arcOrigin={arcOrigin}
          reduce={reduce}
        />

        {/* Floating Round Gold Camera Button — anchored inside phone column right above the sheet */}
        <motion.div
          animate={{
            bottom: `calc(4.5rem + env(safe-area-inset-bottom, 0px) + ${sheetHeightPx + 12}px)`,
          }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 360, damping: 34 }
          }
          className="absolute right-4 z-30 pointer-events-none"
        >
          <motion.button
            type="button"
            whileTap={reduce ? undefined : TAP}
            onClick={handleTraceYours}
            aria-label="Trace a product with camera"
            title="Trace yours"
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-jejak-gold text-jejak-navy shadow-[0_8px_24px_rgba(255,194,75,0.45)] border-2 border-white/95 hover:brightness-105 no-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Camera size={20} strokeWidth={2.4} />
          </motion.button>
        </motion.div>

        {/* Three-Snap-Point Draggable Bottom Sheet (peek | half | full), constrained to phone column */}
        <ExploreBottomSheet
          snap={snap}
          setSnap={setSnap}
          productGroups={productGroups}
          untracedProducts={untracedProducts}
          originFilter={originFilter}
          onClearOrigin={() => setOriginFilter("All")}
          newlyArrivedId={newlyArrivedId}
          onSelectScan={(s) => setSelectedScan(s)}
          onTraceProduct={handleTraceProduct}
          loading={loading}
          reduce={reduce}
        />

        {/* Shared TraceDetailSheet on Row Tap */}
        <TraceDetailSheet
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onTraceProduct={handleTraceProduct}
          reduce={reduce}
        />

        {/* Single-sentence Privacy Sheet */}
        <AnimatePresence>
          {showInfoSheet && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-jejak-navy/40 backdrop-blur-sm"
                onClick={() => setShowInfoSheet(false)}
              />
              <motion.div
                className="relative w-full max-w-[420px] rounded-t-3xl frosted-strong p-5 pb-8"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                    <Sparkles size={13} className="text-jejak-coral" />{" "}
                    Community privacy
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInfoSheet(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-jejak-navy/10 text-jejak-navy no-tap"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-2.5 text-xs font-semibold leading-relaxed text-jejak-navy/80">
                  Every trace is private by default and only appears here when a
                  user explicitly opts in; seeded demo entries are covered by
                  the single “Sample data” banner and excluded from live counts.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}