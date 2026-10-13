import React from "react";
import { CONFIDENCE } from "@/lib/tokens";

export default function ConfidenceBadge({ level = "medium", size = "sm" }) {
  const c = CONFIDENCE[level] || CONFIDENCE.medium;
  const pad = size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide ${pad}`}
      style={{ background: `${c.color}1F`, color: c.color, border: `1px solid ${c.color}55` }}
      aria-label={`Confidence: ${c.label}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}