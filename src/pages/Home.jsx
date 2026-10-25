import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { base44 } from "@/api/base44Client";
import { getProduct, DEMO_CHIPS } from "@/data";
import ScreenShell from "@/components/ScreenShell";
import ProductPicker from "@/components/ProductPicker";
import JournalButton from "@/components/journal/JournalButton";
import MarginNote from "@/components/journal/MarginNote";
import Specimen from "@/components/journal/Specimen";
import { formatMoney } from "@/lib/money";
import { vibrate } from "@/lib/haptics";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

function WashiTape() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-3 left-8 z-10 h-6 w-24"
      style={{
        background: "color-mix(in srgb, var(--j-stamp) 32%, transparent)",
        opacity: 0.75,
        transform: "rotate(-4deg)",
        clipPath: "polygon(2% 0, 98% 4%, 100% 96%, 0 100%)",
      }}
    />
  );
}

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
    setPendingDescribe,
    setScreen,
    setLowConfidence,
    setCustomPrice,
    setMakerTip,
  } = useApp();
  const reduce = useReducedMotion();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const [describe, setDescribe] = useState({ description: "", price: "", brand: "" });
  const receiptRef = useRef(null);
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
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      setPhotoUrl(signed_url);
    } catch {
      setPhotoUrl("");
    } finally {
      setUploading(false);
    }
  };

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

  const submitDescribe = (e) => {
    e.preventDefault();
    if (!describe.description.trim()) return;
    vibrate(8);
    setProduct(null);
    setPhoto(null);
    setPhotoFile(null);
    setPhotoUrl(null);
    setLowConfidence(false);
    setCustomPrice(describe.price ? Number(describe.price) : null);
    setMakerTip(0);
    setPendingDescribe({
      description: describe.description.trim().slice(0, 200),
      price: describe.price ? Number(describe.price) : null,
      brand: describe.brand.trim(),
    });
    setScreen("identifying");
  };

  const handleReceiptFile = async (files) => {
    const file = files && files[0];
    if (!file) return;
    if (!isAuthenticated) { navigateToLogin(); return; }
    vibrate(8);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const rec = await base44.entities.Receipt.create({ file_uri, market, status: "uploaded" });
      navigate(`/journal?receipt=${rec.id}`);
    } catch {
      toast.error("Couldn't start that receipt — try again.");
    }
  };

  const reveal = (delay) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4, ease: "easeOut" } };

  return (
    <ScreenShell section="Trace · new entry">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <div className="grid flex-1 gap-10 px-5 pb-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:px-10 lg:pt-12">
        {/* Capture */}
        <div>
          <motion.p {...reveal(0)} className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-stamp">
            New entry
          </motion.p>
          <motion.h1 {...reveal(0.08)} className="mt-3 font-serif-display text-5xl leading-[1.02] text-journal-ink md:text-6xl" style={displayFont}>
            What are you <em className="italic text-journal-stamp">holding</em>?
          </motion.h1>
          <motion.p {...reveal(0.16)} className="mt-4 max-w-md font-grotesk text-[15px] leading-relaxed text-journal-ink-soft">
            Snap the thing in your hand. Jejak traces where it came from, who made it, and where your money went.
          </motion.p>

          <motion.div {...reveal(0.26)} className="relative mt-8 max-w-md">
            <div className="relative rotate-[-1deg] border border-journal-rule bg-journal-card p-4 shadow-[0_18px_40px_-18px_rgba(30,27,22,0.35)]">
              <WashiTape />
              <div className="flex aspect-[4/3] flex-col items-center justify-center border-2 border-dashed border-journal-rule bg-journal-paper/60 px-6 text-center">
                <svg viewBox="0 0 48 40" className="h-10 w-12 text-journal-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="10" width="40" height="26" rx="3" />
                  <path d="M16 10 L20 4 L28 4 L32 10" />
                  <circle cx="24" cy="22" r="8" />
                  <circle cx="24" cy="22" r="3" />
                </svg>
                <p className="mt-4 font-grotesk text-sm font-medium text-journal-ink">A clear photo works best</p>
                <p className="mt-1 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                  jpg · png · your camera
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <JournalButton onClick={() => cameraRef.current?.click()}>Snap a photo</JournalButton>
                <JournalButton variant="secondary" onClick={() => libraryRef.current?.click()}>
                  Upload one
                </JournalButton>
              </div>
            </div>
            <div className="mt-3">
              <MarginNote tone="ink">your photo stays private</MarginNote>
            </div>
            <form onSubmit={submitDescribe} className="mt-6 max-w-md border border-journal-rule bg-journal-card p-4">
              <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">Describe it instead</p>
              <input
                value={describe.description}
                onChange={(e) => setDescribe((d) => ({ ...d, description: e.target.value }))}
                placeholder="e.g. grey merino wool jumper from Uniqlo"
                maxLength={200}
                className="mt-2 w-full border border-journal-rule bg-journal-paper px-3 py-2.5 font-grotesk text-sm text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={describe.brand}
                  onChange={(e) => setDescribe((d) => ({ ...d, brand: e.target.value }))}
                  placeholder="Brand (optional)"
                  className="w-full border border-journal-rule bg-journal-paper px-3 py-2 font-grotesk text-sm text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                />
                <input
                  value={describe.price}
                  onChange={(e) => setDescribe((d) => ({ ...d, price: e.target.value.replace(/[^0-9.]/g, "") }))}
                  inputMode="decimal"
                  placeholder={`Price in ${currency === "SGD" ? "S$" : "£"} (optional)`}
                  className="w-full border border-journal-rule bg-journal-paper px-3 py-2 font-grotesk text-sm text-journal-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <JournalButton onClick={submitDescribe}>Trace it</JournalButton>
              </div>
            </form>

            <input ref={receiptRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptFile(e.target.files)} />
            <div className="mt-4 max-w-md">
              <JournalButton variant="secondary" onClick={() => receiptRef.current?.click()}>
                Trace a whole receipt
              </JournalButton>
            </div>
          </motion.div>

          {traces > 0 && product && (
            <motion.button
              {...reveal(0.34)}
              type="button"
              onClick={() => { vibrate(6); setScreen("journey"); }}
              className="mt-8 flex w-full max-w-md items-center justify-between border border-journal-rule bg-journal-card px-4 py-3 text-left no-tap hover:bg-journal-paper/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
            >
              <span className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft">Last entry</span>
              <span className="font-grotesk text-sm font-medium text-journal-ink">
                {product.name} · {formatMoney(product.markets[market].price, currency, { minDigits: 0, maxDigits: 0 })} →
              </span>
            </motion.button>
          )}
        </div>

        {/* Specimens */}
        <div>
          <motion.p {...reveal(0.3)} className="font-plexmono text-[11px] uppercase tracking-[0.18em] text-journal-ink-soft">
            Or start with a specimen
          </motion.p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {DEMO_CHIPS.map((c, i) => {
              const p = getProduct(c.id);
              const origin = p.route[0]?.country || "";
              return (
                <motion.button
                  key={c.id}
                  {...reveal(0.36 + i * 0.07)}
                  type="button"
                  onClick={() => pickChipFlow(c.id)}
                  className="group border border-journal-rule bg-journal-card p-4 text-left shadow-[3px_3px_0_0_transparent] transition-all no-tap hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--j-stamp)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
                >
                  <div className="aspect-[200/160]">
                    <Specimen id={c.id} className="h-full w-full" title={`${c.label} illustration`} />
                  </div>
                  <p className="mt-3 font-serif-display text-lg text-journal-ink" style={displayFont}>{c.label}</p>
                  <p className="mt-0.5 font-plexmono text-[10px] uppercase tracking-[0.12em] text-journal-ink-soft">
                    {formatMoney(p.markets[market].price, currency, { minDigits: 0, maxDigits: 0 })} · {origin}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        message="We couldn't identify this one. Pick the closest match and we'll show a category-level estimate."
      />
    </ScreenShell>
  );
}
