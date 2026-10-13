import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ScreenShell from "@/components/ScreenShell";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { formatMoney } from "@/lib/money";
import { Image as ContentImage } from "@/components/ui/image";
import { RefreshCw, Users, MapPin, Radio } from "lucide-react";

const LABOUR_FILTERS = [
  { label: "Any", min: 0 },
  { label: "≥5%", min: 5 },
  { label: "≥10%", min: 10 },
  { label: "≥15%", min: 15 },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold no-tap transition-colors ${
        active ? "bg-jejak-navy text-white" : "frosted text-jejak-navy/70 border border-white/60"
      }`}
    >
      {children}
    </button>
  );
}

function ScanCard({ scan }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="overflow-hidden rounded-2xl frosted"
    >
      <div className="relative aspect-square w-full bg-lilac-peach">
        {scan.photo_url ? (
          <ContentImage src={scan.photo_url} fittingType="fill" className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{scan.emoji}</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-extrabold text-jejak-navy">
          {scan.emoji} {scan.product_name}
        </span>
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-jejak-navy/60">
          <MapPin size={10} /> {scan.origin}
        </div>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-lg font-extrabold text-jejak-labour">{scan.labour_pct}%</span>
          <span className="text-[11px] font-semibold text-jejak-navy/50">to workers</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs font-bold text-jejak-navy">{formatMoney(scan.price, scan.currency)}</span>
          <span className="text-[10px] text-jejak-navy/40">{timeAgo(scan.created_date)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Explore() {
  const [scans, setScans] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [origin, setOrigin] = useState("All");
  const [minLabour, setMinLabour] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const query = {};
    if (origin !== "All") query.origin = origin;
    if (minLabour > 0) query.labour_pct = { $gte: minLabour };
    try {
      const page = await base44.entities.Scan.filter(query, { sort: "-created_date", limit: 50 });
      setScans(page.items || []);
    } catch {
      setScans([]);
    }
    setLoading(false);
  }, [origin, minLabour]);

  useEffect(() => { load(); }, [load]);

  // Distinct origins for the filter chips.
  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.Scan.filter({}, { distinct: "origin", limit: 100 });
        setOrigins(page.items || []);
      } catch {}
    })();
  }, []);

  // Live: prepend new scans as they land.
  useEffect(() => {
    const unsub = base44.entities.Scan.subscribe((event) => {
      if (event.type === "create") {
        setScans((prev) => {
          if (prev.some((s) => s.id === event.data.id)) return prev;
          return [event.data, ...prev];
        });
      }
    });
    return unsub;
  }, []);

  return (
    <ScreenShell variant="soft">
      <div className="flex flex-1 flex-col px-5 pb-28">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-jejak-navy/50">Community</p>
            <h1 className="text-2xl font-extrabold text-jejak-navy">What people are tracing</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-jejak-materials/15 px-2 py-1 text-[10px] font-bold text-jejak-materials">
              <Radio size={11} className="animate-pulse-soft" /> Live
            </span>
            <button
              type="button"
              onClick={load}
              aria-label="Refresh"
              className="flex h-10 w-10 items-center justify-center rounded-full frosted border border-white/60 no-tap"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-jejak-navy/50">Origin</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={origin === "All"} onClick={() => setOrigin("All")}>All</Chip>
              {origins.map((o) => (
                <Chip key={o} active={origin === o} onClick={() => setOrigin(o)}>{o}</Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-jejak-navy/50">Min labour share</p>
            <div className="flex flex-wrap gap-1.5">
              {LABOUR_FILTERS.map((f) => (
                <Chip key={f.label} active={minLabour === f.min} onClick={() => setMinLabour(f.min)}>{f.label}</Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="mt-5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="animate-spin text-jejak-navy/40" />
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} className="text-jejak-navy/30" />
              <p className="mt-3 text-sm font-bold text-jejak-navy/60">No scans match yet</p>
              <p className="text-xs text-jejak-navy/45">Trace a product and share it to populate the feed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {scans.map((s) => (
                <ScanCard key={s.id} scan={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}