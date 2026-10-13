import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import { vibrate } from "@/lib/haptics";

const STATUSES = [
  "Reading label…",
  "Identifying product…",
  "Tracing likely route…",
];

export default function Identifying() {
  const { photo, photoUrl, product, setProduct, setScreen, setLowConfidence, reset } = useApp();
  const reduce = useReducedMotion();
  const [statusIdx, setStatusIdx] = useState(0);
  const [recognized, setRecognized] = useState(null); // {product_id,confidence} | "fail" | "ok"
  const [minDone, setMinDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Minimum display time so the scan animation feels real.
  useEffect(() => {
    const t1 = setInterval(() => setStatusIdx((i) => (i + 1) % STATUSES.length), 950);
    const done = setTimeout(() => setMinDone(true), reduce ? 1200 : 2600);
    return () => { clearInterval(t1); clearTimeout(done); };
  }, [reduce]);

  // Run recognition only when we have an uploaded photo. Chip picks skip it.
  // photo: null → chip pick (product already set) → ok.
  // photoUrl: "" → upload failed → fail. null → still uploading → wait.
  useEffect(() => {
    let cancelled = false;
    if (!photo) {
      setRecognized("ok");
      return;
    }
    if (photoUrl === "") {
      setRecognized("fail");
      return;
    }
    if (!photoUrl) {
      // still uploading — wait for the signed URL
      return;
    }
    base44.functions
      .invoke("identifyProduct", { file_url: photoUrl })
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        if (data.product_id && data.product_id !== "unknown") {
          setRecognized(data);
        } else {
          setRecognized("fail");
        }
      })
      .catch(() => !cancelled && setRecognized("fail"));
    return () => { cancelled = true; };
  }, [photo, photoUrl]);

  // Safety: if a photo was taken but the upload never resolves, fail gracefully.
  useEffect(() => {
    if (!photo || photoUrl || recognized) return;
    const t = setTimeout(() => setRecognized((r) => r || "fail"), 12000);
    return () => clearTimeout(t);
  }, [photo, photoUrl, recognized]);

  // When recognition + min display both done, advance.
  useEffect(() => {
    if (!minDone || recognized === null) return;
    if (recognized === "ok") {
      setScreen("journey");
    } else if (recognized === "fail") {
      setFailed(true);
      setPickerOpen(true);
    } else {
      const p = getProduct(recognized.product_id);
      if (p) {
        setProduct(p);
        setLowConfidence(recognized.confidence === "low");
      }
      vibrate(12);
      setScreen("journey");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDone, recognized]);

  const onPickerPick = (id) => {
    setProduct(getProduct(id));
    setLowConfidence(true);
    setPickerOpen(false);
    vibrate(10);
    setScreen("journey");
  };

  return (
    <ScreenShell header={false} variant="sunrise">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="relative h-72 w-72 overflow-hidden rounded-3xl frosted-strong">
          {photo ? (
            <img src={photo} alt="Your scan" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">{product.emoji}</div>
          )}

          {/* scanning overlay */}
          <div className="absolute inset-0 bg-jejak-navy/10" />
          <motion.div
            className="absolute inset-x-0 h-1.5"
            style={{ background: "linear-gradient(90deg, transparent, #FFC24B, transparent)", boxShadow: "0 0 16px #FFC24B" }}
            initial={{ top: "8%" }}
            animate={{ top: ["8%", "92%", "8%"] }}
            transition={reduce ? { duration: 0.4 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-6 rounded-2xl border-2 border-white/70" />
        </div>

        <div className="mt-8 h-7">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center text-lg font-bold text-white"
            >
              {failed ? "Couldn't identify this one" : STATUSES[statusIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {failed && (
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-xs font-semibold text-white/70 underline-offset-2 hover:underline"
          >
            Back to scan
          </button>
        )}

        {!failed && photoUrl && (
          <p className="mt-2 rounded-full bg-white/25 px-3 py-1 text-[11px] font-bold text-white/90">
            AI vision match
          </p>
        )}
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); reset(); }}
        onPick={onPickerPick}
        message="We couldn't identify this one. Pick the closest match and we'll show a category-level estimate."
      />
    </ScreenShell>
  );
}