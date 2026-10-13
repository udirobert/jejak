import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";

// Vision assistant for Jejak:
// 1. mode === "product" (default): classifies a photographed item into one of the curated demo products.
// 2. mode === "label": reads a garment/product care or "Made in" label and extracts stated country of
//    manufacture, fibre/material composition, and visible care or brand text as structured JSON.
const VALID_IDS = ["hoodie", "trainers", "coffee", "phone_case"];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const mode = body?.mode === "label" ? "label" : "product";
    const fileUrl = body && typeof body.file_url === "string" ? body.file_url : null;
    if (!fileUrl) {
      return Response.json({ error: "file_url is required" }, { status: 400 });
    }

    if (mode === "label") {
      const labelResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          "You are a provenance label reader for Jejak. Inspect this photo of a product care tag, neck label, " +
          "packaging origin stamp, or sole label. Extract ONLY what is visibly written on the label:\n" +
          "1. country_of_manufacture: the country stated after 'Made in', 'Produced in', 'Roasted in', or 'Origin' (e.g. 'Vietnam', 'Bangladesh', 'Ethiopia', 'China'), or empty string if none is visible.\n" +
          "2. fibre_composition: stated material or fibre percentages/ingredients (e.g. '70% cotton, 30% polyester', '100% Arabica coffee', 'TPU / polycarbonate'), or empty string if none is visible.\n" +
          "3. care_or_brand_text: any short visible care instructions, batch/RN code, or brand text (max 10 words), or empty string.\n" +
          "4. readable: true if at least one of country_of_manufacture or fibre_composition is clearly legible in the photo; false if the image is blurry, not a label, or contains unsafe content.",
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            readable: { type: "boolean" },
            country_of_manufacture: { type: "string" },
            fibre_composition: { type: "string" },
            care_or_brand_text: { type: "string" },
          },
          required: ["readable", "country_of_manufacture", "fibre_composition", "care_or_brand_text"],
        },
      });

      return Response.json(labelResult);
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        "You are a product-recognition assistant for Jejak, a supply-chain provenance app. " +
        "Look at the photo and decide which of these products it most likely is:\n" +
        "- \"hoodie\": a hooded sweatshirt or similar garment\n" +
        "- \"trainers\": sneakers or running shoes\n" +
        "- \"coffee\": a bag or cup of coffee (beans or ground)\n" +
        "- \"phone_case\": a phone case\n" +
        "Return the matching id, a short human label (max 3 words), your confidence, and the " +
        "visual attributes you can detect from the photo: the dominant colour, the likely material, " +
        "the product category, and the likely region of origin. Keep each attribute to 1-3 words. " +
        "If the photo is unclear, matches none of these, or contains any explicit, sexual, violent, " +
        "or otherwise unsafe content, return product_id \"unknown\" with confidence \"low\".",
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          product_id: { type: "string", enum: [...VALID_IDS, "unknown"] },
          label: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          attributes: {
            type: "object",
            properties: {
              colour: { type: "string" },
              material: { type: "string" },
              category: { type: "string" },
              likely_origin: { type: "string" },
            },
          },
        },
        required: ["product_id", "label", "confidence"],
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}