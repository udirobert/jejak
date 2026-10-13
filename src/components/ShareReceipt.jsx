import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/AppContext";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import { vibrate } from "@/lib/haptics";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Logo from "./Logo";
import { Share2, FileDown, Loader2, Users } from "lucide-react";

// Builds a solid, shareable receipt image (no frosted glass — html2canvas
// can't capture backdrop-filter), then shares it via the Web Share API or
// falls back to a download. The receipt carries the impact line + branding.
export default function ShareReceipt() {
  const { product, market, currency, compareMode, customPrice, lastStellarTx } = useApp();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const APP_URL = "https://jejak-trace-flow.base44.app";

  const basePrice = product.markets[market].price;
  const price = customPrice != null && customPrice > 0 ? customPrice : basePrice;
  const split = computeSplit(product, market, compareMode ? "transparent" : "split", price);
  const route = getRoute(product, market);
  const labour = split.find((s) => s.key === "labour");
  const stdSplit = computeSplit(product, market, "transparent", price);
  const stdLabour = stdSplit.find((s) => s.key === "labour").amount;
  const curSymbol = currency === "SGD" ? "S$" : "£";
  const impact = `Of ${formatMoney(price, currency)}, about ${formatMoney(labour.amount, currency)} reached the people who made this.`;
  const stdImpact = `A transparent brand would send about ${formatMoney(stdLabour, currency)} their way.`;
  const challenge = `I traced a ${product.name} — only ${labour.pct.mid}% reached the makers. Can you find a fairer one? Trace yours: ${APP_URL}`;

  const buildNode = () => {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "width:360px;padding:28px 26px;background:linear-gradient(160deg,#FF8A65 0%,#FFC24B 50%,#FF3D81 120%);border-radius:24px;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1B1B3A;position:fixed;left:-9999px;top:0;";
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#FFF3C4,#FFC24B 55%,#E8921A);border:2px solid #B5750E;"></div>
        <span style="font-weight:800;font-size:16px;color:#fff;">Jejak</span>
        <span style="margin-left:auto;font-size:10px;font-weight:700;color:#ffffffcc;text-transform:uppercase;letter-spacing:0.05em;">Estimated</span>
      </div>
      <p style="margin:14px 0 2px;font-weight:700;font-size:13px;color:#ffffffdd;">${product.name} · ${product.markets[market].retailer}</p>
      <p style="margin:0 0 14px;font-weight:800;font-size:30px;color:#fff;">${formatMoney(price, currency)}</p>
      <div style="display:flex;height:34px;border-radius:10px;overflow:hidden;background:#ffffff55;">
        ${split.map((c) => `<div style="width:${c.pct.mid}%;background:${c.color};"></div>`).join("")}
      </div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;">
        ${split.map((c) => `
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#1B1B3A;">
            <span style="width:8px;height:8px;border-radius:50%;background:${c.color};display:inline-block;"></span>
            <span style="font-weight:600;">${c.label}</span>
            <span style="margin-left:auto;font-weight:800;">${formatMoney(c.amount, currency)}</span>
          </div>`).join("")}
      </div>
      <div style="margin-top:14px;padding:12px;border-radius:12px;background:#ffffffcc;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#1B1B3A;line-height:1.45;">${impact}</p>
        <p style="margin:6px 0 0;font-size:11px;color:#1B1B3Acc;line-height:1.4;">${stdImpact}</p>
      </div>
      ${
        lastStellarTx
          ? `<div style="margin-top:10px;padding:9px 12px;border-radius:10px;background:#2FBF7125;border:1px solid #2FBF71;font-size:10px;font-weight:700;color:#1B1B3A;">
              ⚡ Demo testnet donation: ${lastStellarTx.xlmSettled} XLM sent to ${lastStellarTx.causeLabel || "Demo cause (testnet)"} · TX ${lastStellarTx.hash.slice(0, 10)}…
             </div>`
          : ""
      }
      <div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:#1B1B3A;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:11px;font-weight:700;color:#fff;">Can you beat ${labour.pct.mid}% to the makers?</span>
        <span style="font-size:11px;font-weight:800;color:#FFC24B;">${APP_URL.replace("https://", "")}</span>
      </div>
      <p style="margin:12px 0 0;font-size:10px;color:#ffffffcc;text-align:center;">${route.length} stops traced · Ranges, not facts · ${APP_URL.replace("https://", "")}</p>
    `;
    document.body.appendChild(wrap);
    return wrap;
  };

  const capture = async () => {
    const node = buildNode();
    try {
      return await html2canvas(node, { scale: 2, backgroundColor: null, logging: false });
    } finally {
      node.remove();
    }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    vibrate(8);
    try {
      const canvas = await capture();
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "jejak-receipt.png", { type: "image/png" });
      const shareData = {
        title: "Jejak — trace what you pay for",
        text: challenge,
        files: [file],
      };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        await navigator.share({ title: shareData.title, text: shareData.text });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "jejak-receipt.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // user cancelled or unsupported — silent
    } finally {
      setBusy(false);
    }
  };

  const handlePdf = async () => {
    if (busy) return;
    setBusy(true);
    vibrate(8);
    try {
      const canvas = await capture();
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(img, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save("jejak-receipt.pdf");
    } catch (e) {
      // silent
    } finally {
      setBusy(false);
    }
  };

  const handleChallenge = async () => {
    vibrate(8);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Jejak challenge", text: challenge });
      } else {
        await navigator.clipboard.writeText(challenge);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch (e) {
      // silent
    }
  };

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-2xl bg-jejak-navy py-3 text-sm font-extrabold text-white no-tap disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          {busy ? "Preparing…" : "Share"}
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-2xl frosted-strong py-3 text-sm font-extrabold text-jejak-navy no-tap disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {busy ? "Preparing…" : "Save PDF"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleChallenge}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-sunrise py-3 text-sm font-extrabold text-white no-tap shadow-md"
      >
        <Users size={16} /> {copied ? "Link copied — send it!" : "Challenge a friend to beat it"}
      </button>
    </div>
  );
}