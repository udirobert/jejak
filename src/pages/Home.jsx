import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import StreakPill from "@/components/StreakPill";
import ViewfinderStage from "@/components/ViewfinderStage";
import DemoProductGrid from "@/components/DemoProductGrid";
import GlobalCorridorTicker from "@/components/GlobalCorridorTicker";
import { vibrate } from "@/lib/haptics";

export default function Home() {
  const {
    market,
    currency,
    setPhoto,
    setPhotoFile,
    setPhotoUrl,
    setProduct,
    setScreen,
    setLowConfidence,
    setCustomPrice,
    setMakerTip,
  } = useApp();
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, setUploading] = useState(false);

  const handleFiles = async (files) => {
    const file = files && files[0];
    if (!file) {
      setPickerOpen(true);
      return;
    }
    vibrate(10);
    // Show the photo instantly via a local object URL.
    setPhoto(URL.createObjectURL(file));
    setPhotoFile(file);
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
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

  const pickChipFlow = (id) => {
    vibrate(8);
    setProduct(getProduct(id));
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
    setPhoto(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setScreen("identifying");
  };

  const jumpChipReceipt = (id) => {
    vibrate(10);
    setProduct(getProduct(id));
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
    setPhoto(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setScreen("split");
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

      <div className="flex flex-1 flex-col px-5 pb-28">
        <div className="mt-1 space-y-2">
          <StreakPill />
          <GlobalCorridorTicker />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="mt-4"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
            Supply-Chain Receipt · Track 01
          </span>
          <h1 className="mt-2 text-[28px] font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-sm">
            Scan any product.<br />See where your money really goes.
          </h1>
        </motion.div>

        <ViewfinderStage
          onPickCamera={onPickCamera}
          onPickLibrary={onPickLibrary}
        />

        <DemoProductGrid
          market={market}
          currency={currency}
          onPickFlow={pickChipFlow}
          onJumpReceipt={jumpChipReceipt}
          onOpenFallback={() => setPickerOpen(true)}
        />
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        message="We couldn't identify this one. Pick the closest match and we'll show a category-level estimate."
      />
    </ScreenShell>
  );
}