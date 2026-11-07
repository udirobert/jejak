// The Oriane evidence layer — one function, three actions.
//
// Oriane (connect.oriane.xyz) is a paid search API over indexed TikTok /
// Instagram / YouTube content and profiles. Jejak uses it only for:
//
//   brand_evidence  — the brand's own posts as provenance evidence
//                     ("Seen in the brand's own posts"), an addition to the
//                     existing bases (Read from label / Trade data /
//                     Estimated), never a replacement for any of them.
//   brand_profile   — the brand's verified account + PUBLIC contact line, so
//                     a drafted brand letter can be handed over with the
//                     right mailbox attached. Jejak still never sends.
//   category_pulse  — the conversation around a category (what guess-first
//                     pools need to put something in front of someone who
//                     arrived holding nothing). Volume only; never used as
//                     provenance for a specific stage.
//
// Honesty rules live in base44/shared/oriane.ts; this file is transport plus
// ceilings, not semantics. Notably: no user photo is ever sent anywhere, and
// every response degrades visibly (`available: false`) instead of inventing
// an answer when Oriane is unreachable, unconfigured or out of quota.
//
// Stream/auth policy:
//   - brand_evidence + brand_profile require a signed-in user and are called
//     from inside a trace (Base44 SDK auth, same as draftBrandLetter).
//   - category_pulse is anonymous: guess-first pools are the acquisition
//     surface, and a sign-up wall there is the bug the wager just fixed.
//     It is also the cheap-to-bill endpoint, so it is the one the Base44
//     dashboard rate limit should watch.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import {
  BRAND_POSTS_BASIS,
  brandHandleCandidates,
  buildBrandEvidenceBody,
  buildBrandProfilesBody,
  buildCategoryPulseBody,
  conversationSize,
  evidenceConfidence,
  pickBrandProfile,
  toEvidencePosts,
} from "../../shared/oriane.ts";

const ORIANE_BASE = "https://connect.oriane.xyz/rest";
const SEARCH_LIMIT = 25;

interface OrianeEnvelope {
  data?: { results?: any[] };
  metadata?: { pagination?: { totalCount?: number } };
  error?: { operation?: string; code?: string; message?: string };
}

async function orianeSearch(
  path: string,
  searchParams: string,
  body: unknown,
  apiKey: string,
): Promise<{ ok: boolean; envelope?: OrianeEnvelope; status: number; code?: string }> {
  const res = await fetch(
    `${ORIANE_BASE}${path}?${searchParams}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  let envelope: OrianeEnvelope | undefined;
  try {
    envelope = await res.json();
  } catch {
    return { ok: false, status: res.status };
  }
  const code = envelope?.error?.code;
  // 402 with an operation error is the quota/billing signal; report it as an
  // unavailable feature, never as a failed trace.
  return { ok: res.ok && !envelope?.error, envelope, status: res.status, code };
}

function unavailable(reason: string) {
  return {
    available: false as const,
    reason,
    basis: BRAND_POSTS_BASIS,
  };
}

export default async function (req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const action = typeof body?.action === "string" ? body.action : "";

    // category_pulse is the only anonymous action (see header).
    if (action === "category_pulse") {
      return await runCategoryPulse(body);
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (action === "brand_profile") return await runBrandProfile(body);
    if (action === "brand_evidence") return await runBrandEvidence(body);

    return Response.json({ error: `unknown action: ${action || "(none)"}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

async function requireKey() {
  const key = Deno.env.get("ORIANE_API_KEY");
  return key && key.startsWith("beta_") ? key : null;
}

function brandInput(body: any): string {
  return typeof body?.brand === "string" ? body.brand.trim() : "";
}

async function runBrandProfile(body: any) {
  const key = await requireKey();
  if (!key) return Response.json(unavailable("ORIANE_API_KEY is not configured"));
  const brand = brandInput(body);
  if (!brand) return Response.json({ error: "brand is required" }, { status: 400 });

  const handles = brandHandleCandidates(brand);
  const res = await orianeSearch(
    "/profiles/search",
    `limit=${SEARCH_LIMIT}&projection=full`,
    buildBrandProfilesBody(handles),
    key,
  );
  if (!res.ok || !res.envelope?.data) {
    return Response.json(
      unavailable(res.code === "NOT_ENOUGH_HONEY" ? "oriane quota" : "oriane unreachable"),
    );
  }
  const profile = pickBrandProfile(res.envelope.data.results || []);
  if (!profile) return Response.json({ available: true, found: false });
  return Response.json({
    available: true,
    found: true,
    // Only public account data. The letter page decides what to do with it;
    // Jejak never sends mail to it.
    profile,
  });
}

async function runBrandEvidence(body: any) {
  const key = await requireKey();
  if (!key) return Response.json(unavailable("ORIANE_API_KEY is not configured"));
  const brand = brandInput(body);
  if (!brand) return Response.json({ error: "brand is required" }, { status: 400 });

  const handles = brandHandleCandidates(brand);

  // Two calls: the profiles search pins down which handles are real accounts,
  // the contents search finds their making-of language. The contents call is
  // constrained to every candidate handle up front — a stray viral video
  // talking about the category must never become evidence about the brand.
  const [profileRes, contentsRes] = await Promise.all([
    orianeSearch(
      "/profiles/search",
      `limit=${SEARCH_LIMIT}&projection=full`,
      buildBrandProfilesBody(handles),
      key,
    ),
    orianeSearch(
      "/contents/search",
      `limit=${SEARCH_LIMIT}&projection=default`,
      buildBrandEvidenceBody(handles),
      key,
    ),
  ]);

  if (!contentsRes.ok || !contentsRes.envelope?.data) {
    return Response.json(
      unavailable(contentsRes.code ? `oriane quota (${contentsRes.code})` : "oriane unreachable"),
    );
  }

  const profile = profileRes.envelope?.data
    ? pickBrandProfile(profileRes.envelope.data.results || [])
    : null;
  const posts = toEvidencePosts(contentsRes.envelope.data.results || []);
  const conversation = conversationSize(contentsRes.envelope.metadata?.pagination?.totalCount);

  return Response.json({
    available: true,
    basis: BRAND_POSTS_BASIS,
    // The label travels with the data so the client cannot invent its own.
    confidence: evidenceConfidence(profile, posts.length),
    profile,
    posts,
    conversation,
    // Deliberately absent on purpose, so callers can't silently upgrade the
    // label or the confidence.
    stageClaim: null,
  });
}

async function runCategoryPulse(body: any) {
  const key = await requireKey();
  if (!key) return Response.json(unavailable("ORIANE_API_KEY is not configured"));
  const words = Array.isArray(body?.words) ? body.words.map(String) : [];
  if (!words.length) return Response.json({ error: "words is required" }, { status: 400 });

  const res = await orianeSearch(
    "/contents/search",
    "limit=6&projection=default&sort=viewsCount:desc",
    buildCategoryPulseBody(words),
    key,
  );
  if (!res.ok || !res.envelope?.data) {
    return Response.json(
      unavailable(res.code ? `oriane quota (${res.code})` : "oriane unreachable"),
    );
  }
  return Response.json({
    available: true,
    // The conversation size round-trips raw so the client can hide small
    // ones (a count of one is never shown as a count).
    conversation: conversationSize(res.envelope.metadata?.pagination?.totalCount),
    items: toEvidencePosts(res.envelope.data.results || []),
  });
}
