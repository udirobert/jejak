import React, { useState } from "react";
import { useApp } from "@/lib/AppContext";
import { computeSplit, formatMoney, getRoute } from "@/lib/money";
import { vibrate } from "@/lib/haptics";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Share2, FileDown, Loader2, Users } from "lucide-react";
import { traceUrl } from "@/lib/share";

// Builds a solid, shareable receipt image (no frosted glass — html2canvas
// can't capture backdrop-filter), then shares it via the Web Share API or
// falls back to a download. The receipt carries the impact line + branding.
export default function ShareReceipt() {
  const { product, market, currency, compareMode, customPrice, lastStellarTx, savedScanId } = useApp();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const basePrice = product.markets[market].price;
  const price = customPrice != null && customPrice > 0 ? customPrice : basePrice;
  const split = computeSplit(product, market, compareMode ? "transparent" : "split", price);
  const route = getRoute(product, market);
  const labour = split.find((s) => s.key === "labour");
  const stdSplit = computeSplit(product, market, "transparent", price);
  const stdLabour = stdSplit.find((s) => s.key === "labour").amount;
  const impact = `Of ${formatMoney(price, currency)}, about ${formatMoney(labour.amount, currency)} reached the people who made this.`;
  const stdImpact = `A transparent brand would send about ${formatMoney(stdLabour, currency)} their way.`;
  // A shared link has to BE the thing. Pointing at the app root meant the
  // person you challenged landed on the landing page with nothing to beat.
  const link = traceUrl(savedScanId);
  const challenge = `I traced a ${product.name} — only ${labour.pct.mid}% reached the makers. Can you find a fairer one? ${link}`;

  const buildNode = () => {
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "width:380px;padding:30px 26px;background:#F3EDE2;font-family:'IBM Plex Mono','Courier New',monospace;color:#1E1B16;position:fixed;left:-9999px;top:0;";
    const zig = "background:conic-gradient(from 135deg at top,#0000,#F3EDE2 1deg 89deg,#0000 90deg) top/14px 51% repeat-x,conic-gradient(from -45deg at bottom,#0000,#F3EDE2 1deg 89deg,#0000 90deg) bottom/14px 51% repeat-x,#FBF8F2;";
    wrap.innerHTML = `
      <div style="${zig}padding:26px 22px;box-shadow:0 14px 30px -14px rgba(30,27,22,0.35);">
        <p style="margin:0;text-align:center;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#5B544A;">Jejak field receipt</p>
        <p style="margin:4px 0 0;text-align:center;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#5B544A;">— where the money went —</p>
        <p style="margin:14px 0 2px;font-size:11px;color:#5B544A;">${product.name} · ${product.markets[market].retailer}</p>
        <p style="margin:0 0 12px;font-size:24px;font-weight:500;">${formatMoney(price, currency)}</p>
        ${split.map((c) => `
          <div style="display:flex;align-items:baseline;gap:6px;padding:5px 0;font-size:11px;">
            <span style="width:8px;height:8px;background:${c.color};display:inline-block;"></span>
            <span>${c.label}</span>
            <span style="flex:1;border-bottom:1px dotted #5B544A;"></span>
            <span style="font-weight:500;">${formatMoney(c.amount, currency)}</span>
          </div>`).join("")}
        <div style="display:flex;align-items:baseline;gap:6px;border-top:1px solid #1E1B16;margin-top:8px;padding-top:8px;font-size:12px;font-weight:500;">
          <span>TOTAL</span>
          <span style="flex:1;border-bottom:1px dotted #5B544A;"></span>
          <span>${formatMoney(price, currency)}</span>
        </div>
        <p style="margin:14px 0 0;font-family:'Caveat',cursive;font-size:17px;color:#C8442B;">${impact}</p>
        <p style="margin:8px 0 0;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#5B544A;">${route.length} stops traced · every figure is a range</p>
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:'Fraunces',serif;font-style:italic;font-size:15px;">Jejak</span>
          <span style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#5B544A;">${link.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
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
    } catch {
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
    } catch {
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
    } catch {
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
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] bg-journal-ink py-2.5 font-grotesk text-sm font-medium text-journal-paper no-tap shadow-[3px_3px_0_0_var(--j-stamp)] transition-transform hover:-translate-y-px disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={14} strokeWidth={1.5} />}
          {busy ? "Preparing…" : "Share the receipt"}
        </button>
        <button
          type="button"
          onClick={handlePdf}
          disabled={busy}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-[2px] border border-journal-rule bg-journal-card py-2.5 font-grotesk text-sm font-medium text-journal-ink no-tap disabled:opacity-60 hover:bg-journal-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={14} strokeWidth={1.5} />}
          {busy ? "Preparing…" : "Save as PDF"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleChallenge}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 font-grotesk text-sm font-medium text-journal-ink no-tap underline decoration-journal-stamp underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp"
      >
        <Users size={14} strokeWidth={1.5} /> {copied ? "Link copied — send it" : "Challenge a friend to beat it"}
      </button>
    </div>
  );
}