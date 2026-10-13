import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Image as ContentImage } from "@/components/ui/image";
import {
  FLAGS,
  PRODUCT_SURFACES,
  isSampleScan,
  materialOriginLine,
  hasOwnAnchoredRecord,
  txExplorerUrl,
} from "./exploreUtils";
import { vibrate } from "@/lib/haptics";

export default function LiveHeroSlot({
  scan,
  onSelectScan,
  reduce,
}) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Subtle arrival progress indicator that fills once for the current newest trace
  // and pauses on touch or hover. It never auto-cycles through older items.
  useEffect(() => {
    setProgress(0);
  }, [scan?.id]);

  useEffect(() => {
    if (!scan || reduce || paused || progress >= 100) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 2.5));
    }, 80);
    return () => clearInterval(id);
  }, [scan, reduce, paused, progress]);

  if (!scan) return null;

  const anchored = hasOwnAnchoredRecord(scan);
  const explorerHref = txExplorerUrl(scan);
  const bg = PRODUCT_SURFACES[scan.product_id] || PRODUCT_SURFACES.hoodie;

  return (
    <div
      className="py-3.5 border-b border-jejak-navy/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/50 mb-1.5">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-jejak-coral ${
              reduce || paused ? "" : "animate-pulse"
            }`}
          />
          Latest trace
          {paused ? " · paused" : ""}
        </span>
        <div className="flex items-center gap-2">
          {isSampleScan(scan) && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-jejak-navy/55">
              Sample
            </span>
          )}
          {anchored && (
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-jejak-freight hover:underline"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-jejak-materials" />
              Anchored <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={scan.id || `${scan.product_id}-${scan.origin}`}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
          role="button"
          tabIndex={0}
          onClick={() => {
            vibrate(5);
            onSelectScan(scan);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectScan(scan);
            }
          }}
          className="group flex items-center justify-between gap-3 cursor-pointer no-tap"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-extrabold tracking-tight text-jejak-navy group-hover:text-jejak-freight transition-colors">
                {scan.product_name}
              </span>
              <span className="text-lg" title={scan.origin}>
                {FLAGS[scan.origin] || "🌐"}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-jejak-navy/65 truncate">
              {materialOriginLine(scan)}
            </p>
          </div>

          <div
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: bg }}
          >
            {scan.photo_url ? (
              <ContentImage
                src={scan.photo_url}
                fittingType="fill"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{scan.emoji || "🧥"}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Subtle arrival progress bar */}
      <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-jejak-navy/10">
        <div
          className="h-full bg-jejak-navy/45 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}