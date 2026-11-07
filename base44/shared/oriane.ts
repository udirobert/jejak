// Pure helpers for the Oriane evidence layer.
//
// Oriane (connect.oriane.xyz) is a search API over indexed TikTok / Instagram /
// YouTube content. Jejak uses it for exactly two epistemic moves, never for
// decoration:
//
//   1. "Seen in the brand's own posts" — provenance evidence a consumer can
//      check without Jejak: the brand's verified account talking about
//      where / how things are made.
//   2. A demand-side proxy for the brand-margin line, which is otherwise the
//      least-sourced figure in the split ("AI inference", low confidence).
//
// HONESTY RULES (product requirements, not preferences):
//
//   - Matching here is term-level, not semantic: a loose phrase misses, a
//     loose match is noise. Every query is built from the FIXED phrase sets
//     below — never improvised by an LLM at trace time.
//   - Everything Oriane returns is capped at LOW confidence ("medium" only
//     when the brand's VERIFIED profile itself posted making-of language).
//   - The result quotes and links; it never claims a stage, a factory or a
//     country. Absence is rendered as absence by the caller, not as
//     disagreement.
//   - No user photo ever goes to Oriane: there is no endpoint here that
//     accepts one. Visual search would require uploading an image asset and
//     is deliberately out of scope (collides with Private-by-Default).
//
// Pure and synchronous, like guess.ts — tested in oriane.test.ts without a
// network connection.

export const BRAND_POSTS_BASIS = "Seen in the brand's own posts";
export const MAX_EVIDENCE_POSTS = 5;
export const MIN_EVIDENCE_FOR_MEDIUM = 3;

// Confidence never rises past these ceilings. `evidenceConfidence` enforces it.
export const EVIDENCE_CONFIDENCE = {
  LOW: "low",
  MEDIUM: "medium",
} as const;

// Making-of language, in the brand's own words. Deliberately small and
// generic: term-level matching means every extra phrase is extra noise.
export const BRAND_MAKING_PHRASES: string[] = [
  "how it's made",
  "where it was made",
  "where they are made",
  "factory tour",
  "who made this",
  "meet the makers",
  "behind the seams",
  "from the factory",
  "made in",
];

// On-screen text carries making-of claims too (IG carousels rarely have a
// transcript, but their text cards often do).
export const BRAND_MAKING_ONSCREEN_PHRASES: string[] = [
  "factory",
  "made in",
  "where it's made",
  "production",
  "supply chain",
];

// A brand is sometimes @brand, sometimes @brandofficial, @brand.official …
// Six candidates max — every one is a billable query value (≤500 across a
// request), and a wider net only pulls in lookalike accounts.
export function brandHandleCandidates(brand: string): string[] {
  const slug = String(brand || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!slug) return [];
  return Array.from(
    new Set([
      slug,
      `${slug}official`,
      `${slug}.official`,
      `${slug}_official`,
      `the${slug}`,
    ]),
  ).slice(0, 6);
}

// The contents search body for a brand's own making-of language: the brand's
// handles AND (transcript OR caption hitting the phrase set) AND (on-screen
// text hitting the on-screen set). Oriane's body is a filter tree; this is
// the shape.
export interface OrianeSearchBody {
  name: string;
  operator: "and";
  filters?: Record<string, unknown>;
  queries: Array<{
    operator: "and" | "or";
    filters: Record<string, unknown>;
  }>;
}

function includesExactly(values: string[], operator: "and" | "or") {
  return { includesExactly: { values, operator } };
}

export function buildBrandEvidenceBody(handles: string[]): OrianeSearchBody {
  return {
    name: "brand-evidence",
    operator: "and",
    filters: {
      profileHandle: { includesExactly: { values: handles, operator: "or" } },
    },
    queries: [
      {
        operator: "or",
        filters: {
          transcript: includesExactly(BRAND_MAKING_PHRASES, "or"),
          caption: includesExactly(BRAND_MAKING_PHRASES, "or"),
        },
      },
      {
        operator: "or",
        filters: {
          onScreenText: includesExactly(BRAND_MAKING_ONSCREEN_PHRASES, "or"),
        },
      },
    ],
  };
}

// The profiles search body: find the brand's real, verified account.
export function buildBrandProfilesBody(handles: string[]) {
  return {
    operator: "and",
    filters: {
      handle: { includesExactly: { values: handles, operator: "or" } },
    },
  };
}

// Guess-first pools need something to guess about. This is the "what is this
// category talking about" query: a conversation-size probe for the pool's
// context line and today's item cards. Volume only — never used as
// provenance for a specific stage.
export function buildCategoryPulseBody(words: string[]): OrianeSearchBody {
  const clean = words.map((w) => String(w).trim()).filter(Boolean).slice(0, 6);
  return {
    name: "category-pulse",
    operator: "and",
    filters: {
      caption: {
        includesFuzzy: { values: clean, operator: "and" },
      },
    },
    queries: [],
  };
}

// A link that lets the consumer check the claim without Jejak. Per-post URLs
// are best-effort (platform paths differ and drift); the profile URL is the
// always-correct fallback, so every card carries both.
export interface EvidencePost {
  platform: string;
  handle: string;
  profileUrl: string;
  postUrl: string | null;
  format: string | null;
  publishedAt: string;
  caption: string;
  viewsCount: number | null;
  likesCount: number | null;
}

export function profileUrlFor(platform: string, handle: string): string {
  const h = encodeURIComponent(handle);
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    case "instagram":
    default:
      return `https://www.instagram.com/${h}/`;
  }
}

export function postUrlFor(
  platform: string,
  platformType: string | null | undefined,
  platformId: string | null | undefined,
  handle: string,
): string | null {
  if (!platformId || !handle) return null;
  switch (platform) {
    case "instagram": {
      const kind = platformType === "reel" ? "reel" : "p";
      return `https://www.instagram.com/${kind}/${platformId}/`;
    }
    case "tiktok":
      return platformType === "photo"
        ? `https://www.tiktok.com/@${handle}/photo/${platformId}`
        : `https://www.tiktok.com/@${handle}/video/${platformId}`;
    case "youtube":
      return `https://www.youtube.com/watch?v=${platformId}`;
    default:
      return null;
  }
}

const CAPTION_MAX = 300;

function num(v: unknown): number | null {
  return typeof v === "number" && isFinite(v) ? v : null;
}

// Shapes raw Oriane content results into citation-safe evidence cards.
// Sorted newest-first, capped at MAX_EVIDENCE_POSTS.
export function toEvidencePosts(results: any[]): EvidencePost[] {
  return (results || [])
    .filter((r) => r && typeof r === "object")
    .sort(
      (a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")),
    )
    .slice(0, MAX_EVIDENCE_POSTS)
    .map((r) => ({
      platform: String(r.platform || ""),
      handle: String(r.profileHandle || ""),
      profileUrl: profileUrlFor(String(r.platform || ""), String(r.profileHandle || "")),
      postUrl: postUrlFor(String(r.platform || ""), r.platformType, r.platformId, String(r.profileHandle || "")),
      format: typeof r.format === "string" ? r.format : null,
      publishedAt: String(r.publishedAt || ""),
      caption: String(r.caption || r.description || r.title || "").slice(0, CAPTION_MAX),
      viewsCount: num(r.viewsCount),
      likesCount: num(r.likesCount),
    }));
}

// Picks the brand's real account: verified wins, biggest reach wins.
export interface BrandProfile {
  platform: string;
  handle: string;
  isVerified: boolean;
  followersCount: number | null;
  publicEmail: string | null;
  profileUrl: string;
}

export function pickBrandProfile(results: any[]): BrandProfile | null {
  const list = (results || []).filter((r) => r && typeof r === "object");
  if (!list.length) return null;
  list.sort((a, b) => {
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    return (b.followersCount || 0) - (a.followersCount || 0);
  });
  const r = list[0];
  const platform = String(r.platform || "");
  const handle = String(r.handle || "");
  return {
    platform,
    handle,
    isVerified: !!r.isVerified,
    followersCount: num(r.followersCount),
    publicEmail: typeof r.publicEmail === "string" ? r.publicEmail : null,
    profileUrl: profileUrlFor(platform, handle),
  };
}

// The confidence ceiling. `medium` requires the verified account itself AND
// enough posts that it isn't one coincidence; everything else stays `low`.
export function evidenceConfidence(
  profile: BrandProfile | null,
  postCount: number,
): string {
  if (profile && profile.isVerified && postCount >= MIN_EVIDENCE_FOR_MEDIUM) {
    return EVIDENCE_CONFIDENCE.MEDIUM;
  }
  return EVIDENCE_CONFIDENCE.LOW;
}

// A legible, copyable conversation-size figure. The count of one is never
// shown as a count anywhere in this app; categories run in the thousands,
// but the caller still hides anything that rounds below ten.
export function conversationSize(totalCount: unknown): number | null {
  const n = Number(totalCount);
  if (!isFinite(n) || n < 0) return null;
  return Math.floor(n);
}
