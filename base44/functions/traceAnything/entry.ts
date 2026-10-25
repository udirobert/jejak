import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { traceItem } from "../../shared/trace.ts";

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    let body;
    try { body = await req.json(); } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const description = typeof body?.description === "string" ? body.description.trim().slice(0, 200) : "";
    if (!description) {
      return Response.json({ error: "description is required" }, { status: 400 });
    }
    const result = await traceItem(base44, {
      description,
      market: body.market === "SG" ? "SG" : "GB",
      price: typeof body.price === "number" && body.price > 0 ? body.price : null,
      brand: typeof body.brand === "string" ? body.brand : undefined,
      labelCountry: typeof body.labelCountry === "string" ? body.labelCountry : undefined,
      labelMaterials: typeof body.labelMaterials === "string" ? body.labelMaterials : undefined,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
