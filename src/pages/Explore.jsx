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
import ExploreWorldHeader from "@/components/explore/ExploreWorldHeader";
import LiveHeroSlot from "@/components/explore/LiveHeroSlot";
import TypographicTraceRow from "@/components/explore/TypographicTraceRow";
import TraceDetailSheet from "@/components/explore/TraceDetailSheet";

const INITIAL_VISIBLE_LIMIT = 8;

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [originFilter, setOriginFilter] = useState("All");
  const [selectedScan, setSelectedScan] = useState(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [newlyArrivedId, setNewlyArrivedId] = useState(null);
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
      setScans(page.items || []);
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live subscription: crossfades hero slot and animates new trace into top of list
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type !== "create") return;
      const s = event.data;
      setNewlyArrivedId(s.id);
      setScans((prev) => (prev.some((p) => p.id === s.id) ? prev : [s, ...prev]));
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
      if (!s.is_sample) prev.real += 1;
      map.set(o, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scans]);

  const filteredScans = useMemo(() => {
    if (originFilter === "All") return scans;
    return scans.filter((s) => s.origin === originFilter);
  }, [scans, originFilter]);

  // Group duplicate traces per product in newest-first order
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

  const visibleGroups = showAllRows
    ? productGroups
    : productGroups.slice(0, INITIAL_VISIBLE_LIMIT);

  const newestScan = filteredScans[0] || scans[0] || null;

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

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-36">
        {/* Flat World Map Header with Origin Flag Filter */}
        <ExploreWorldHeader
          originChips={originChips}
          originFilter={originFilter}
          onSelectOrigin={setOriginFilter}
          onOpenInfo={() => setShowInfoSheet(true)}
          reduce={reduce}
        />

        {/* Single Live Hero Slot above the list */}
        <LiveHeroSlot
          scan={newestScan}
          onSelectScan={(s) => setSelectedScan(s)}
          reduce={reduce}
        />

        {/* Borderless Typographic List */}
        <div className="flex-1">
          {loading ? (
            <div className="divide-y divide-jejak-navy/10">
              {[0, 1, 2].map((i) => (
                <div key={i} className="py-5 animate-pulse space-y-2">
                  <div className="h-6 w-44 rounded bg-jejak-navy/10" />
                  <div className="h-3.5 w-60 rounded bg-jejak-navy/10" />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {visibleGroups.map((group) => (
                <TypographicTraceRow
                  key={group.productId}
                  group={group}
                  isNewlyArrived={group.items.some(
                    (it) => it.id === newlyArrivedId
                  )}
                  onSelectScan={(s) => setSelectedScan(s)}
                  reduce={reduce}
                />
              ))}

              {/* See all toggle if rows exceed 8 */}
              {productGroups.length > INITIAL_VISIBLE_LIMIT && (
                <div className="py-3 border-b border-jejak-navy/10">
                  <button
                    type="button"
                    onClick={() => {
                      vibrate(5);
                      setShowAllRows((v) => !v);
                    }}
                    className="text-xs font-extrabold text-jejak-freight hover:underline no-tap"
                  >
                    {showAllRows
                      ? "Show fewer"
                      : `See all (${productGroups.length})`}
                  </button>
                </div>
              )}

              {/* "Be the first to trace this" typographic rows for untraced products */}
              {untracedProducts.map((prod) => (
                <div
                  key={prod.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTraceProduct(prod.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTraceProduct(prod.id);
                    }
                  }}
                  className="group py-4 border-b border-jejak-navy/12 flex items-baseline justify-between gap-3 cursor-pointer no-tap"
                >
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-jejak-navy/45 group-hover:text-jejak-navy transition-colors">
                      {prod.name}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-jejak-coral">
                      Be the first to trace this →
                    </p>
                  </div>
                  <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">
                    {prod.emoji}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Primary CTA: "Trace yours" */}
        <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 px-5 pointer-events-none">
          <motion.button
            type="button"
            whileTap={reduce ? undefined : TAP}
            onClick={handleTraceYours}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3.5 text-sm font-extrabold text-white shadow-xl border border-white/20 no-tap"
          >
            <Camera size={16} className="text-amber-300" />
            <span>Trace yours</span>
          </motion.button>
        </div>

        {/* Detail Bottom Sheet */}
        <TraceDetailSheet
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onTraceProduct={handleTraceProduct}
          reduce={reduce}
        />

        {/* Single-sentence ⓘ Opt-in Explanation Sheet */}
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
                  Every trace is private by default and only appears here when a user explicitly opts in; seeded demo entries are marked “Sample” and never counted as real activity.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenShell>
  );
}