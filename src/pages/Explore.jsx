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
import ExploreBottomSheet from "@/components/explore/ExploreBottomSheet";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [originFilter, setOriginFilter] = useState("All");
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [snap, setSnap] = useState("half");
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
      if (items[0]?.origin) {
        setArcOrigin(items[0].origin);
      }
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Clear initial arrival arc after animation finishes
  useEffect(() => {
    if (!arcOrigin) return;
    const t = setTimeout(() => setArcOrigin(null), 2400);
    return () => clearTimeout(t);
  }, [arcOrigin]);

  // Live subscription: animates an arc from the new trace's origin dot into the sheet
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      setNewlyArrivedId(s.id);
      if (s.origin) setArcOrigin(s.origin);
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

  const originChips = useMemo(() => {
    const map = new Map();
    scans.forEach((s) => {
      const o = s.origin || "Bangladesh";
      const prev = map.get(o) || { origin: o, total: 0, real: 0 };
      prev.total += 1;
      if (!s.sample_entry && !s.is_sample) prev.real += 1;
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

  const handleSelectOrigin = (origin) => {
    setOriginFilter(origin);
    if (origin !== "All") {
      setArcOrigin(origin);
      if (snap === "peek") setSnap("half");
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

  // Position floating round gold camera button right above the draggable sheet
  // (or tucked cleanly in the top-right corner when sheet is full) so it never covers content.
  const fabBottomClass =
    snap === "peek"
      ? "bottom-[168px]"
      : snap === "half"
      ? "bottom-[382px]"
      : "bottom-[572px]";

  return (
    <ScreenShell variant="map">
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Full-bleed High-Contrast Interactive Map Background */}
        <ExploreFullBleedMap
          originChips={originChips}
          originFilter={originFilter}
          onSelectOrigin={handleSelectOrigin}
          onOpenInfo={() => setShowInfoSheet(true)}
          arcOrigin={arcOrigin}
          reduce={reduce}
        />

        {/* Floating Round Gold Camera Button (never covers list rows) */}
        <div
          className={`fixed left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 px-5 pointer-events-none transition-all duration-300 ${fabBottomClass}`}
        >
          <div className="flex justify-end">
            <motion.button
              type="button"
              whileTap={reduce ? undefined : TAP}
              onClick={handleTraceYours}
              aria-label="Trace a product with camera"
              title="Trace yours"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-jejak-gold text-jejak-navy shadow-[0_8px_24px_rgba(255,194,75,0.45)] border-2 border-white/90 hover:brightness-105 no-tap"
            >
              <Camera size={20} strokeWidth={2.4} />
            </motion.button>
          </div>
        </div>

        {/* Three-Snap-Point Draggable Bottom Sheet (peek | half | full) */}
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

        {/* Detail Sheet on Row Tap */}
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
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-jejak-navy">
                    <Sparkles size={13} className="text-jejak-coral" /> Community privacy
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
                  Every trace is private by default and only appears here when a user explicitly opts in; seeded demo entries are covered by the single “Sample data” banner and excluded from live counts.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}