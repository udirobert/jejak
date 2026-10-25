import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { buildBrandLetterPrompt, BRAND_LETTER_SCHEMA } from "../../shared/prompts.ts";

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const brand = typeof body?.brand === "string" ? body.brand.trim() : "";
    if (!brand) return Response.json({ error: "brand is required" }, { status: 400 });

    const senderFirstName = (user.full_name || "").trim().split(/\s+/)[0] || undefined;
    const letter: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildBrandLetterPrompt({
        brand,
        productName: typeof body.productName === "string" ? body.productName : "this product",
        labelCountry: typeof body.labelCountry === "string" ? body.labelCountry : undefined,
        labelMaterials: typeof body.labelMaterials === "string" ? body.labelMaterials : undefined,
        estimatedStages: Array.isArray(body.estimatedStages) ? body.estimatedStages.map(String) : [],
        senderFirstName,
      }),
      response_json_schema: BRAND_LETTER_SCHEMA,
    });

    // Created AS THE USER so ownership/RLS is correct.
    const record = await base44.entities.BrandRequest.create({
      scan_id: typeof body.scan_id === "string" ? body.scan_id : "",
      brand,
      product_name: typeof body.productName === "string" ? body.productName : "",
      subject: letter.subject || "",
      body: letter.body || "",
      questions: Array.isArray(letter.questions) ? letter.questions.slice(0, 3) : [],
      status: "drafted",
    });
    return Response.json({ ok: true, record });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
