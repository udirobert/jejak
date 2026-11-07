import { assertEquals } from "jsr:@std/assert";
import {
  BRAND_MAKING_PHRASES,
  BRAND_POSTS_BASIS,
  buildBrandEvidenceBody,
  buildBrandProfilesBody,
  buildCategoryPulseBody,
  brandHandleCandidates,
  conversationSize,
  evidenceConfidence,
  MAX_EVIDENCE_POSTS,
  pickBrandProfile,
  postUrlFor,
  profileUrlFor,
  toEvidencePosts,
} from "./oriane.ts";

Deno.test("brandHandleCandidates — slug, common variants, capped and deduped", () => {
  assertEquals(brandHandleCandidates("Asket"), [
    "asket",
    "asketofficial",
    "asket.official",
    "asket_official",
    "theasket",
  ]);
  // Dots and spaces collapse into one slug.
  assertEquals(brandHandleCandidates("ASKET AB")[0], "asketab");
  assertEquals(brandHandleCandidates("  "), []);
});

Deno.test("the brand-evidence query always uses the fixed phrase set", () => {
  const body = buildBrandEvidenceBody(["asket"]);
  const t = body.queries[0].filters.transcript as any;
  const c = body.queries[0].filters.caption as any;
  assertEquals(t.includesExactly.values, BRAND_MAKING_PHRASES);
  assertEquals(c.includesExactly.values, BRAND_MAKING_PHRASES);
  // The profile handle constrains the whole tree — a stray viral video must
  // not make it into a claim about a brand.
  assertEquals((body.filters!.profileHandle as any).includesExactly.values, ["asket"]);
});

Deno.test("buildCategoryPulseBody — trims and caps the word list", () => {
  const body = buildCategoryPulseBody(["hoodie ", "", "merino", "sweat", "knit", "wool", "extra", "extra2"]);
  const f = (body.filters as any).caption;
  assertEquals(f.includesFuzzy.values.length, 6);
  assertEquals(f.includesFuzzy.values.includes(""), false);
});

Deno.test("toEvidencePosts — newest first, capped, citation-shape", () => {
  const posts = toEvidencePosts([
    { platform: "instagram", profileHandle: "asket", platformType: "reel", platformId: "R1", publishedAt: "2026-01-01", caption: "a".repeat(900), viewsCount: 5 },
    { platform: "instagram", profileHandle: "asket", platformType: "post", platformId: "P2", publishedAt: "2026-03-01", caption: "newer", likesCount: 10 },
    { platform: "instagram", profileHandle: "asket", platformType: "carousel_album", platformId: "C3", publishedAt: "2026-02-01", caption: "middle" },
    { platform: "instagram", profileHandle: "asket", platformType: "post", platformId: "P4", publishedAt: "2025-01-01", caption: "old" },
    { platform: "instagram", profileHandle: "asket", platformType: "post", platformId: "P5", publishedAt: "2024-01-01", caption: "older" },
    { platform: "instagram", profileHandle: "asket", platformType: "post", platformId: "P6", publishedAt: "2023-01-01", caption: "oldest" },
  ]);
  assertEquals(posts.length, MAX_EVIDENCE_POSTS);
  assertEquals(new Date(posts[0].publishedAt) > new Date(posts[1].publishedAt), true);
  // The caption is a quote, never the whole caption.
  assertEquals(posts.find((p) => p.postUrl === "https://www.instagram.com/reel/R1/")!.caption.length, 300);
  // "oldest" (post 6) is the one that got cut.
  assertEquals(posts.some((p) => p.caption === "oldest"), false);
});

Deno.test("postUrlFor — per-platform paths, profile link as fallback", () => {
  assertEquals(postUrlFor("instagram", "reel", "R1", "asket"), "https://www.instagram.com/reel/R1/");
  assertEquals(postUrlFor("instagram", "carousel_album", "C3", "asket"), "https://www.instagram.com/p/C3/");
  assertEquals(postUrlFor("tiktok", "photo", "T9", "who"), "https://www.tiktok.com/@who/photo/T9");
  assertEquals(postUrlFor("youtube", null, "abc", "who"), "https://www.youtube.com/watch?v=abc");
  assertEquals(postUrlFor("instagram", "post", null, "asket"), null);
  assertEquals(profileUrlFor("instagram", "asket"), "https://www.instagram.com/asket/");
});

Deno.test("pickBrandProfile — verified wins over reach", () => {
  const p = pickBrandProfile([
    { platform: "instagram", handle: "bigfan", isVerified: false, followersCount: 9_000_000, publicEmail: "fan@example.com" },
    { platform: "instagram", handle: "asket", isVerified: true, followersCount: 258_460, publicEmail: "care@asket.com" },
  ]);
  assertEquals(p!.handle, "asket");
  assertEquals(p!.publicEmail, "care@asket.com");
  assertEquals(p!.profileUrl, "https://www.instagram.com/asket/");
  assertEquals(pickBrandProfile([]), null);
});

Deno.test("evidenceConfidence — medium only for the verified account with enough posts", () => {
  const verified = { platform: "instagram", handle: "asket", isVerified: true, followersCount: 1, publicEmail: null, profileUrl: "" };
  const unverified = { platform: "instagram", handle: "fan", isVerified: false, followersCount: 2, publicEmail: null, profileUrl: "" };
  // 2 posts is one coincidence; 3 posts from the verified account is a voice.
  assertEquals(evidenceConfidence(verified, 2), "low");
  assertEquals(evidenceConfidence(verified, 3), "medium");
  assertEquals(evidenceConfidence(unverified, 9), "low");
  assertEquals(evidenceConfidence(null, 9), "low");
});

Deno.test("conversationSize — a count, floored; garbage stays absent", () => {
  assertEquals(conversationSize(593259.7), 593259);
  assertEquals(conversationSize(-1), null);
  assertEquals(conversationSize("nope"), null);
});

Deno.test("the basis label reads as a source, not a verdict", () => {
  // If this ever changes, the UI badge and the docs change with it.
  assertEquals(BRAND_POSTS_BASIS, "Seen in the brand's own posts");
});
