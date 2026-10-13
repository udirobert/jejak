import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { vibrate } from "@/lib/haptics";
import { TAP } from "@/lib/motion";
import { Lock, Users, Camera, ShieldCheck } from "lucide-react";

const MODES = [
  {
    key: "private",
    label: "Private (default)",
    sub: "On your device only",
    icon: Lock,
  },
  {
    key: "count",
    label: "Count only",
    sub: "+1 to tally · no photo",
    icon: Users,
  },
  {
    key: "feed",
    label: "Public feed",
    sub: "Share card + photo to Explore",
    icon: Camera,
  },
];

export function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function TodaySnapPulse({
  product,
  shareMode,
  setShareMode,
  compact = false,
}) {
  const [realOptInCount, setRealOptInCount] = useState(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [confirmingFeed, setConfirmingFeed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [realN, sampleN] = await Promise.all([
          base44.entities.Scan.count({
            product_id: product.id,
            is_sample: { $ne: true },
          }),
          base44.entities.Scan.count({
            product_id: product.id,
            is_sample: true,
          }),
        ]);
        if (!cancelled) {
          setRealOptInCount(realN);
          setSampleCount(sampleN);
        }
      } catch {
        if (!cancelled) {
          setRealOptInCount(0);
          setSampleCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const effectiveReal =
    (realOptInCount ?? 0) + (shareMode !== "private" ? 1 : 0);

  // Privacy rule: hide single-person real counts (count === 1) so an individual cannot be singled out.
  let socialHeadline = "Checking community traces…";
  if (realOptInCount !== null) {
    if (effectiveReal >= 2) {
      socialHeadline = `${effectiveReal} people traced this ${product.name.toLowerCase()} (opted-in)`;
    } else if (sampleCount > 0) {
      socialHeadline = `${sampleCount} sample trace${sampleCount > 1 ? "s" : ""} in Explore · real counts shown at 2+`;
    } else {
      socialHeadline = `No public traces yet · real counts shown once 2+ people opt in`;
    }
  }

  return (
    <div className="rounded-2xl frosted p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jejak-navy/10 text-base">
            {product.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-jejak-navy truncate">
              {socialHeadline}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-semibold text-jejak-navy/55">
              <ShieldCheck size={11} className="text-jejak-materials shrink-0" />
              Real opted-in data only · seeded records labelled “Sample”
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-jejak-materials/15 px-2 py-0.5 text-[10px] font-extrabold text-jejak-materials">
          Explore
        </span>
      </div>

      {!compact && setShareMode && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-jejak-navy/50">
            Share to community (default off)
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map(({ key, label, sub, icon: Icon }) => {
              const active = shareMode === key;
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileTap={TAP}
                  onClick={() => {
                    vibrate(6);
                    if (key === "feed" && shareMode !== "feed") {
                      setConfirmingFeed(true);
                    } else {
                      setConfirmingFeed(false);
                      setShareMode(key);
                    }
                  }}
                  aria-pressed={active}
                  className={`flex flex-col items-start rounded-xl p-2 text-left no-tap transition-colors border ${
                    active
                      ? "bg-jejak-navy text-white border-jejak-navy"
                      : "bg-white/60 text-jejak-navy border-white/70 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-extrabold">
                    <Icon
                      size={12}
                      className={active ? "text-amber-300" : "text-jejak-navy/60"}
                    />
                    <span>{label}</span>
                  </div>
                  <p
                    className={`mt-0.5 text-[9px] leading-tight font-semibold ${
                      active ? "text-white/75" : "text-jejak-navy/55"
                    }`}
                  >
                    {sub}
                  </p>
                </motion.button>
              );
            })}
          </div>
          {confirmingFeed && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-jejak-navy p-2.5 text-white">
              <p className="text-[10px] font-semibold leading-snug text-white/85">
                Your product photo will be uploaded to a publicly viewable URL for the Explore feed (label photos are never uploaded). Continue?
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmingFeed(false)}
                  className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold text-white/80 no-tap"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingFeed(false);
                    setShareMode("feed");
                  }}
                  className="rounded-lg bg-amber-300 px-2.5 py-1 text-[10px] font-extrabold text-jejak-navy no-tap"
                >
                  Confirm public
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}