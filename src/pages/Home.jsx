import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { DEMO_CHIPS, getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ShutterButton from "@/components/ShutterButton";
import ProductPicker from "@/components/ProductPicker";
import { Camera, Sparkles } from "lucide-react";

export default function Home() {
  const { setPhoto, setProduct, setScreen, setLowConfidence } = useApp();
  const inputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (!file) {
      setPickerOpen(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setLowConfidence(false);
      setScreen("identifying");
    };
    reader.onerror = () => setPickerOpen(true);
    reader.readAsDataURL(file);
  };

  const onPickFile = () => inputRef.current?.click();

  const pickChip = (id) => {
    setProduct(getProduct(id));
    setLowConfidence(false);
    setPhoto(null);
    setScreen("identifying");
  };

  return (
    <ScreenShell variant="sunrise">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-1 flex-col px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
          className="mt-6"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-white/80">Trace what you pay for</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white drop-shadow-sm">
            Scan any product.<br />See where your money really goes.
          </h1>
        </motion.div>

        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <ShutterButton onPick={onPickFile} />
          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <Camera size={15} /> Tap to scan
          </p>
        </div>

        <div className="rounded-3xl frosted-strong p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-jejak-navy/60">
            <Sparkles size={14} /> Or choose a demo product
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pickChip(c.id)}
                className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3.5 py-2 text-sm font-bold text-jejak-navy no-tap hover:bg-white transition-colors"
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 text-xs font-semibold text-jejak-navy/50 underline-offset-2 hover:underline"
          >
            Camera not working? Pick instead
          </button>
        </div>
      </div>

      <ProductPicker open={pickerOpen} onClose={() => setPickerOpen(false)} message="We couldn't identify this one. Pick the closest match and we'll show a category-level estimate." />
    </ScreenShell>
  );
}