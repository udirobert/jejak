import { useRef, useCallback } from "react";
import { useApp } from "@/lib/AppContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { getRoute, computeSplit } from "@/lib/money";
import { routeDistance } from "@/lib/metrics";

// Creates ONE Scan record per trace session (guarded by product id) with the
// fields the story automation + journal need. Returns the record or null when
// the user is signed out.
export function useSaveTrace() {
  const app = useApp();
  const { isAuthenticated } = useAuth();
  const inFlight = useRef(null);

  const source = app.photo ? "photo" : app.pendingDescribe ? "describe" : "sample";

  const ensureSaved = useCallback(async () => {
    if (!isAuthenticated) return null;
    if (app.savedScanId) return app.savedScanId;
    if (inFlight.current) return inFlight.current;
    const p = app.product;
    const mkt = app.market;
    const route = getRoute(p, mkt);
    const split = computeSplit(p, mkt);
    const labour = split.find((s) => s.key === "labour");
    const run = (async () => {
      const rec = await base44.entities.Scan.create({
        product_id: p.id,
        product_name: p.name,
        emoji: p.emoji || "",
        origin: route[0]?.country || "",
        labour_pct: labour?.pct?.mid ?? 0,
        price: app.customPrice ?? p.markets[mkt].price,
        currency: app.currency,
        market: mkt,
        confidence: p.confidence || "low",
        basis: app.labelEvidence ? "Read from label" : "Estimated",
        owner_id: undefined,
        visibility: "private",
        source,
        brand: p.brand || "",
        trace_json: p.aiGenerated ? JSON.stringify(p) : "",
        route_json: JSON.stringify(route.map((s) => ({ stage: s.stage, country: s.country, basis: s.basis || "Estimated" }))),
        distance_km: routeDistance(p, mkt),
        labour_amount: labour?.amount ?? 0,
        story_status: "pending",
        label_country: app.labelEvidence?.country_of_manufacture || "",
        label_materials: app.labelEvidence?.fibre_composition || "",
      });
      app.setSavedScanId(rec.id);
      return rec.id;
    })();
    inFlight.current = run;
    try {
      return await run;
    } finally {
      inFlight.current = null;
    }
  }, [isAuthenticated, app, source]);

  const setVisibility = useCallback(
    async (public_) => {
      const id = await ensureSaved();
      if (!id) return null;
      await base44.entities.Scan.update(id, { visibility: public_ ? "public" : "private" });
      return id;
    },
    [ensureSaved]
  );

  return { isAuthenticated, savedScanId: app.savedScanId, ensureSaved, setVisibility, source };
}
