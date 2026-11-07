import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// "Seen in the brand's own posts" — the fourth basis, added alongside
// Read from label / Trade data / Estimated.
//
// The brand's own social posts are the maker's voice about its product.
// This card shows a few of those posts as *evidence you can check yourself*:
// every line links out, so the claim is verifiable without Jejak. What it
// never does:
//
//   - claim a supply-chain stage (a video about knitting is not provenance
//     for the knitting stage — Daniel Dennett's rule: volume ≠ value)
//   - send your photo anywhere (there is no image input to this card at all)
//   - promise high confidence: the ceiling is "medium", and only when the
//     brand's VERIFIED account itself posted making-of language in enough
//     posts. Otherwise the label says "rough guess" — the same word the
//     journey uses for its weakest provenance.
//
// Absence renders as absence: no posts, no card, nothing implied.
const CONFIDENCE_WORD = { high: "sure", medium: "fairly sure", low: "rough guess" };
const CAPTION_MAX = 300;

const fmtViews = (n) =>
  n == null ? "" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`;

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
};

export default function BrandEvidenceCard({ brand, reduce = false }) {
  const [evidence, setEvidence] = useState(null);

  const name = String(brand || "").trim();

  useEffect(() => {
    if (!name) return undefined;
    let alive = true;
    setEvidence(null);
    base44.functions
      .invoke("orianeEvidence", { action: "brand_evidence", brand: name })
      .then((r) => {
        const d = r?.data || r;
        if (alive && d?.available && Array.isArray(d.posts) && d.posts.length > 0) {
          setEvidence(d);
        }
        // 401 for signed-out visitors and `{available:false}` both land here:
        // the card is simply absent. A trace never fails because a paid
        // evidence API is missing.
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name]);

  if (!evidence) return null;

  const { posts, profile, confidence = "low" } = evidence;
  const cap = (s) => (String(s || "").length > CAPTION_MAX ? `${String(s).slice(0, CAPTION_MAX)}…` : String(s || ""));
  const channelHandle = profile?.handle || posts[0]?.handle || "";

  return (
    <div className="mt-3 border border-journal-rule bg-journal-paper/70 p-3">
      <p className="font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink">
        Seen in the brand{channelHandle ? `'s own posts · @${channelHandle}` : "'s own posts"}
      </p>

      <p className="mt-1.5 font-grotesk text-[13px] leading-relaxed text-journal-ink-soft">
        {name}'s own account posts {posts.length === 1 ? "says" : "say"} things like the quotes
        below — links to the {posts.length === 1 ? "post" : "posts"} follow, so you can check
        without me.
      </p>

      <div className="mt-2 space-y-2">
        {posts.slice(0, 5).map((post, i) => (
          <a
            key={i}
            href={post.postUrl || post.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="block border-l-2 border-journal-materials/50 bg-journal-card/60 p-2.5 no-tap hover:border-journal-materials"
          >
            <blockquote className="font-grotesk text-[13px] italic leading-relaxed text-journal-ink">
              “{cap(post.caption)}”
            </blockquote>
            <p className="mt-1.5 font-plexmono text-[9px] uppercase tracking-[0.08em] text-journal-ink-soft">
              {post.platform}
              {post.viewsCount != null ? ` · ${fmtViews(post.viewsCount)} views` : ""}
              {post.publishedAt ? ` · ${fmtDate(post.publishedAt)}` : ""}
              {post.postUrl ? "" : " · quote via the account, link goes to the profile"}
            </p>
          </a>
        ))}
      </div>

      <p className="mt-2 font-plexmono text-[10px] uppercase tracking-[0.1em] text-journal-ink-soft">
        {CONFIDENCE_WORD[confidence] || "rough guess"} · quotes only, not a stage claim · volume
        from public posts is context, not proof
      </p>
    </div>
  );
}
