// Jejak AI prompts + JSON schemas. Shared by backend functions.
// Honesty rules are part of the product: every AI figure is a range, carries a
// confidence level, and a basis label from a fixed set. AI output never claims
// "high" confidence unless the fact was read from a label/receipt.

export const BASIS_LABELS = [
  "public price benchmark",
  "published brand disclosure",
  "trade data",
  "AI inference",
] as const;

export const CATEGORY_KEYS = ["materials", "labour", "freight", "brand", "retail"] as const;

const pctRange = {
  type: "object",
  properties: {
    low: { type: "number" },
    mid: { type: "number" },
    high: { type: "number" },
  },
  required: ["low", "mid", "high"],
};

const splitEntry = {
  type: "object",
  properties: {
    pct: pctRange,
    confidence: { type: "string", enum: ["medium", "low"] },
    basis: { type: "string", enum: [...BASIS_LABELS] },
  },
  required: ["pct", "confidence", "basis"],
};

// ---------------------------------------------------------------------------
// 1. Trace anything: product description (+ optional photo/label facts) -> trace
// ---------------------------------------------------------------------------

export const TRACE_SCHEMA = {
  type: "object",
  properties: {
    traceable: { type: "boolean" },
    name: { type: "string" },
    category: { type: "string" },
    brand: { type: "string" },
    estimated_price: { type: "number" },
    route: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stage: { type: "string" },
          country: { type: "string" },
          code: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          note: { type: "string" },
          basis: { type: "string", enum: ["Read from label", "Estimated"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["stage", "country", "code", "lat", "lng", "note", "basis", "confidence"],
      },
    },
    split: {
      type: "object",
      properties: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, splitEntry])),
      required: [...CATEGORY_KEYS],
    },
    labour_context: { type: "string" },
    overall_confidence: { type: "string", enum: ["medium", "low"] },
  },
  required: [
    "traceable",
    "name",
    "category",
    "estimated_price",
    "route",
    "split",
    "labour_context",
    "overall_confidence",
  ],
};

export function buildTracePrompt(input: {
  description: string;
  market: "GB" | "SG";
  currency: "GBP" | "SGD";
  price?: number | null;
  labelCountry?: string;
  labelMaterials?: string;
  brand?: string;
}): string {
  const where = input.market === "SG" ? "Singapore" : "the United Kingdom";
  const labelLines = [
    input.labelCountry ? `- The product's label states it was made in: ${input.labelCountry}` : "",
    input.labelMaterials ? `- The label states the materials are: ${input.labelMaterials}` : "",
  ].filter(Boolean);

  return [
    "You are the supply-chain analyst for Jejak, an app that shows shoppers the likely journey of a product",
    "and where the money they paid probably went. You are careful, specific and honest about uncertainty.",
    "",
    `Product: ${input.description}`,
    input.brand ? `Brand: ${input.brand}` : "",
    `Bought in: ${where} (currency ${input.currency})`,
    input.price ? `Price paid: ${input.price} ${input.currency}` : "Price paid: unknown",
    ...(labelLines.length ? ["Facts read from the product label (treat as true):", ...labelLines] : []),
    "",
    "Return the TYPICAL supply chain for this kind of product, based on well-known global trade patterns.",
    "Rules:",
    "1. traceable: false if this is not a physical manufactured or farmed good (e.g. a service, a person, an animal,",
    "   a landscape) or if the input is unsafe/explicit. Otherwise true.",
    "2. route: 2 to 5 production stages in order, from raw material to the last stop BEFORE the shop.",
    `   Do NOT include the final retail stop in ${where}; the app adds it.`,
    "   Each stage: a short stage name (2-4 words, e.g. 'Cotton farming', 'Cut & sew', 'Roasting'),",
    "   the single most likely country, its ISO 3166-1 alpha-2 code, a representative lat/lng inside that country",
    "   (production region if well known, else the country's centre), and a plain-English note of max 10 words.",
    "   basis: 'Read from label' ONLY for the manufacturing stage whose country matches the label country; that stage",
    "   gets confidence 'high'. Every other stage is 'Estimated' with 'medium' (well-documented pattern) or 'low'.",
    "3. split: what share of the shelf price likely went to materials, labour (wages of the people who made it),",
    "   freight & duties, brand (brand margin + marketing), and retail (shop margin + rent + staff).",
    "   Give low/mid/high percentages. The five mid values MUST sum to exactly 100. low <= mid <= high.",
    "   confidence is 'medium' or 'low' only. basis must be one of: " + BASIS_LABELS.join(", ") + ".",
    "   Use 'AI inference' whenever you are not drawing on a widely published benchmark.",
    `4. estimated_price: if price is unknown, a typical shelf price in ${input.currency}; otherwise repeat the price paid.`,
    "5. labour_context: 1-2 sentences on who likely made it and the wage context, factual and non-judgemental.",
    "   Never name or accuse a specific company of abuses.",
    "6. name: a short, friendly product name (max 4 words). category: one word (e.g. apparel, footwear, food, electronics).",
    "7. overall_confidence: 'medium' if this is a common, well-documented product type; otherwise 'low'.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// ---------------------------------------------------------------------------
// 2. Receipt reader: photo of a shop receipt -> line items
// ---------------------------------------------------------------------------

export const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    readable: { type: "boolean" },
    merchant: { type: "string" },
    purchase_date: { type: "string" },
    currency: { type: "string", enum: ["GBP", "SGD", "OTHER"] },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          brand: { type: "string" },
          quantity: { type: "number" },
          unit_price: { type: "number" },
          traceable: { type: "boolean" },
        },
        required: ["description", "quantity", "unit_price", "traceable"],
      },
    },
  },
  required: ["readable", "merchant", "currency", "items"],
};

export const RECEIPT_PROMPT = [
  "You read shop receipts for Jejak. Look at this receipt photo and extract ONLY what is printed on it.",
  "- readable: false if the image is not a receipt, is illegible, or contains unsafe content.",
  "- merchant: the shop name as printed (empty string if not visible).",
  "- purchase_date: ISO date YYYY-MM-DD if printed, else empty string.",
  "- currency: GBP if prices use £, SGD if S$ or a Singapore merchant, otherwise OTHER.",
  "- items: one entry per purchased product line. Expand abbreviations into a plain product description",
  "  (e.g. 'MNS CTN TEE BLK' -> 'Men's black cotton t-shirt'). Put a brand in brand only if printed.",
  "  quantity defaults to 1. unit_price is the price per unit as a number.",
  "  Skip totals, subtotals, tax, discounts, bags, delivery, gift cards, deposits and payment lines.",
  "  traceable: true for physical manufactured or farmed goods; false for services, fees, tickets or vouchers.",
  "- At most 15 items. Never invent items that are not printed.",
].join("\n");

// ---------------------------------------------------------------------------
// 3. Journey story: a completed trace -> short journal entry + share caption
// ---------------------------------------------------------------------------

export const STORY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    story: { type: "string" },
    caption: { type: "string" },
  },
  required: ["title", "story", "caption"],
};

export function buildStoryPrompt(t: {
  productName: string;
  route: { stage: string; country: string; basis?: string }[];
  distanceKm: number;
  price: number;
  currency: string;
  labourAmount: number;
  labelCountry?: string;
}): string {
  const stops = t.route.map((s, i) => `${i + 1}. ${s.stage}, ${s.country}${s.basis === "Read from label" ? " (read from label)" : " (estimated)"}`);
  return [
    "Write a short field-journal entry for Jejak about the likely journey of one product.",
    `Product: ${t.productName}. Price: ${t.price} ${t.currency}. Distance travelled: about ${Math.round(t.distanceKm).toLocaleString("en-GB")} km.`,
    `Estimated amount that went to the people who made it: ${t.labourAmount.toFixed(2)} ${t.currency}.`,
    "Route:",
    ...stops,
    "",
    "Rules:",
    "- title: max 7 words, evocative, no clickbait (e.g. 'Six countries in one hoodie').",
    "- story: 3-4 sentences, 70 words max, second person ('Your hoodie began...'), warm and concrete,",
    "  following the stops in order. Use hedged language for estimated stops ('likely', 'probably');",
    "  state label-read facts plainly. Mention the labour amount once. No moralising, no brand accusations,",
    "  no emojis, no hashtags.",
    "- caption: one sentence for social sharing, max 20 words, no hashtags.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// 4. Ask the brand: a trace -> polite transparency request letter
// ---------------------------------------------------------------------------

export const BRAND_LETTER_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["subject", "body", "questions"],
};

export function buildBrandLetterPrompt(t: {
  brand: string;
  productName: string;
  labelCountry?: string;
  labelMaterials?: string;
  estimatedStages: string[];
  senderFirstName?: string;
}): string {
  return [
    "Draft a short, polite email from a customer to a brand asking for supply-chain transparency about one product.",
    `Brand: ${t.brand}. Product: ${t.productName}.`,
    t.labelCountry ? `The label says it was made in ${t.labelCountry}.` : "",
    t.labelMaterials ? `The label lists materials: ${t.labelMaterials}.` : "",
    `Stages the customer could only estimate: ${t.estimatedStages.join("; ") || "none"}.`,
    "",
    "Rules:",
    "- subject: max 9 words.",
    "- body: 120-170 words, plain text, friendly and specific, no accusations, no legal threats.",
    "  Ask 3 concrete questions matching the estimated stages (e.g. where the fibre was grown, which factory",
    "  assembled it, whether they publish a supplier list, what share of the price goes to wages).",
    `  Sign off with ${t.senderFirstName ? `'${t.senderFirstName}'` : "'A customer'"}. Mention the email was prepared with Jejak in one short line at the end.`,
    "- questions: the same 3 questions as a list, each max 15 words.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
