import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { buildStoryPrompt, STORY_SCHEMA } from "../../shared/prompts.ts";

// Entity automation: on Scan create, write a short field-journal entry for it.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    // Entity automation payload: { event: {entity_name, entity_id, type}, data: <record> }
    // payload_too_large => data is null; fetch the record by id instead.
    const id = body?.event?.entity_id ?? body?.data?.id;
    const record = body?.data ?? (id ? await base44.asServiceRole.entities.Scan.get(id) : null);
    if (!id || !record) return Response.json({ ok: false, reason: "no_record" }, { status: 400 });

    // Seeded/sample-library records don't get stories; a real user's sample trace does.
    if (record.is_sample || record.sample_entry) {
      await base44.asServiceRole.entities.Scan.update(id, { story_status: "skipped" });
      return Response.json({ ok: true, skipped: true });
    }
    if (record.story_status && record.story_status !== "pending") {
      return Response.json({ ok: true, already: record.story_status });
    }

    await base44.asServiceRole.entities.Scan.update(id, { story_status: "writing" });

    let route: any[] = [];
    try {
      if (record.route_json) route = JSON.parse(record.route_json);
      else if (record.trace_json) route = (JSON.parse(record.trace_json).route || []).map((s: any) => ({ stage: s.stage, country: s.country, basis: s.basis }));
    } catch {}
    if (!route.length) route = [{ stage: "Origin", country: record.origin || "Unknown", basis: "Estimated" }];

    try {
      const story: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildStoryPrompt({
          productName: record.product_name || "this thing",
          route,
          distanceKm: record.distance_km || 0,
          price: record.price || 0,
          currency: record.currency || "GBP",
          labourAmount: record.labour_amount || 0,
          labelCountry: record.label_country || undefined,
        }),
        response_json_schema: STORY_SCHEMA,
      });
      await base44.asServiceRole.entities.Scan.update(id, {
        story_title: story.title || "",
        story_text: story.story || "",
        story_caption: story.caption || "",
        story_status: "done",
      });
      return Response.json({ ok: true });
    } catch (err) {
      await base44.asServiceRole.entities.Scan.update(id, { story_status: "failed" });
      throw err;
    }
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
