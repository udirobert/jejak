import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { DEMO_CHIPS, getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ShutterButton from "@/components/ShutterButton";
import ProductPicker from "@/components/ProductPicker";
import { vibrate } from "@/lib/haptics";
import { Camera, Image as ImageIcon, Sparkles } from "lucide-react";

export default function Home() {
  const { setPhoto, setPhotoUrl, setProduct, setScreen, setLowConfidence } = useApp();
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    const file = files && files[0];
    if (!file) {
      setPickerOpen(true);
      return;
    }
    vibrate(10);
    // Show the photo instantly via a local object URL.
    setPhoto(URL.createObjectURL(file));
    setLowConfidence(false);
    setScreen("identifying");
    // Upload privately, then mint a short-lived signed URL the vision model
    // can fetch for one-time recognition (stored privately — not a public URL).
    try {
      setUploading(true);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      setPhotoUrl(signed_url);
    } catch {
      setPhotoUrl(""); // empty string signals "upload failed" to Identifying
    } finally {
      setUploading(false);
    }
  };

  const onPickCamera = () => cameraRef.current?.click();
  const onPickLibrary = () => libraryRef.current?.click();

  const pickChip = (id) => {
    vibrate(8);
    setProduct(getProduct(id));
    setLowConfidence(false);
    setPhoto(null);
    setPhotoUrl(null);
    setScreen("identifying");
  };

  return (
    <ScreenShell variant="sunrise">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-1 flex-col px-6 pb-28">
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
          <ShutterButton onPick={onPickCamera} />
          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <Camera size={15} /> Take a photo
          </p>
          <div className="mt-5 flex items-center gap-3 self-stretch px-2">
            <span className="h-px flex-1 bg-white/30" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">or</span>
            <span className="h-px flex-1 bg-white/30" />
          </div>
          <button
            type="button"
            onClick={onPickLibrary}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl frosted border border-white/70 px-5 py-3.5 text-sm font-extrabold text-jejak-navy no-tap hover:bg-white/90 transition-colors"
          >
            <ImageIcon size={18} /> Upload from photos
          </button>
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