import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

// Recognises a photographed product into one of the curated demo products.
// Uses the vision LLM via Core.InvokeLLM (service role — no user data touched).
// Returns { product_id, label, confidence } or { product_id: "unknown" }.
const VALID_IDS = ["hoodie", "trainers", "coffee", "phone_case"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const fileUrl = body && typeof body.file_url === "string" ? body.file_url : null;
    if (!fileUrl) {
      return Response.json({ error: "file_url is required" }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        "You are a product-recognition assistant for Jejak, a supply-chain transparency app. " +
        "Look at the photo and decide which of these products it most likely is:\n" +
        "- \"hoodie\": a hooded sweatshirt or similar garment\n" +
        "- \"trainers\": sneakers or running shoes\n" +
        "- \"coffee\": a bag or cup of coffee (beans or ground)\n" +
        "- \"phone_case\": a phone case\n" +
        "Return the matching id, a short human label (max 3 words), and your confidence. " +
        "If the photo is unclear or matches none of these, return product_id \"unknown\" with confidence \"low\".",
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          product_id: { type: "string", enum: [...VALID_IDS, "unknown"] },
          label: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["product_id", "label", "confidence"],
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}