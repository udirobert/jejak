import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import StreakPill from "@/components/StreakPill";
import ViewfinderStage from "@/components/ViewfinderStage";
import HomeMiniRouteCard from "@/components/HomeMiniRouteCard";
import { vibrate } from "@/lib/haptics";

export default function Home() {
  const {
    product,
    market,
    currency,
    traces,
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
    setPhoto(URL.createObjectURL(file));
    setPhotoFile(file);
    setLowConfidence(false);
    setCustomPrice(null);
    setMakerTip(0);
    setScreen("identifying");
    try {
      setUploading(true);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
        file,
      });
      const { signed_url } =
        await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      setPhotoUrl(signed_url);
    } catch {
      setPhotoUrl("");
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

  const openLatestRoute = () => {
    vibrate(6);
    setScreen("journey");
  };

  return (
    <ScreenShell variant="sunrise" showCurrency={false}>
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
        <StreakPill />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="mt-2.5 text-center"
        >
          <h1 className="text-[22px] font-extrabold leading-[1.15] tracking-tight text-white">
            Know the story behind what you buy.
          </h1>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-white/75">
            Snap any item or care tag to see its route and where your money goes.
          </p>
        </motion.div>

        <ViewfinderStage
          market={market}
          currency={currency}
          onPickCamera={onPickCamera}
          onPickLibrary={onPickLibrary}
          onPickSample={pickChipFlow}
          onOpenFallback={() => setPickerOpen(true)}
        />

        <HomeMiniRouteCard
          product={product}
          market={market}
          currency={currency}
          hasTraced={traces > 0}
          onInspectJourney={openLatestRoute}
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