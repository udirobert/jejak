import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { RECEIPT_PROMPT, RECEIPT_SCHEMA } from "../../shared/prompts.ts";
import { traceItem, haversineKm } from "../../shared/trace.ts";

// Entity automation: on Receipt create, read the photo and trace each line item.
export default async function (req: Request) {
  const base44 = createClientFromRequest(req);
  let receiptId: string | undefined;
  try {
    const body = await req.json();
    // payload_too_large => data is null; fetch the record by id instead.
    receiptId = body?.event?.entity_id ?? body?.data?.id;
    const record = body?.data ?? (receiptId ? await base44.asServiceRole.entities.Receipt.get(receiptId) : null);
    if (!receiptId || !record?.file_uri) {
      return Response.json({ ok: false, reason: "no_record" }, { status: 400 });
    }
    const sr = base44.asServiceRole;
    const rid = receiptId;
    await sr.entities.Receipt.update(rid, { status: "reading" });

    const { signed_url } = await sr.integrations.Core.CreateFileSignedUrl({ file_uri: record.file_uri });
    const parsed: any = await sr.integrations.Core.InvokeLLM({
      prompt: RECEIPT_PROMPT,
      response_json_schema: RECEIPT_SCHEMA,
      file_urls: [signed_url],
    });

    if (!parsed?.readable) {
      await sr.entities.Receipt.update(rid, { status: "failed", error: "We couldn't read that receipt" });
      return Response.json({ ok: false, reason: "unreadable" });
    }

    const currency = parsed.currency === "SGD" ? "SGD" : parsed.currency === "GBP" ? "GBP" : "";
    const market = currency === "SGD" ? "SG" : currency === "GBP" ? "GB" : record.market || "GB";

    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    let traceableCount = 0;
    const items = rawItems.slice(0, 15).map((it: any) => {
      const traceable = Boolean(it.traceable) && traceableCount++ < 8;
      return {
        description: String(it.description || "").slice(0, 120),
        brand: String(it.brand || ""),
        name: "",
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        traceable: Boolean(it.traceable),
        status: traceable ? "pending" : "skipped",
        scan_id: "",
      };
    });

    await sr.entities.Receipt.update(receiptId, {
      status: "tracing",
      merchant: parsed.merchant || "",
      purchase_date: parsed.purchase_date || "",
      currency: currency || (market === "SG" ? "SGD" : "GBP"),
      items,
    });

    // Trace with concurrency 3.
    const queue: { it: any; i: number }[] = items.map((it: any, i: number) => ({ it, i })).filter((x: { it: any }) => x.it.status === "pending");
    const worker = async (): Promise<void> => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) break;
        const { it, i } = next;
        try {
          const result = await traceItem(base44, {
            description: it.description,
            brand: it.brand || undefined,
            price: it.unit_price > 0 ? it.unit_price : null,
            market,
          });
          if (!result.ok) {
            it.status = result.reason === "not_traceable" ? "skipped" : "failed";
          } else {
            const p = result.product;
            const routeStops = [...(p.route || []), (p.finalStop as any)?.[market]].filter(Boolean);
            let km = 0;
            for (let j = 1; j < routeStops.length; j++) km += haversineKm(routeStops[j - 1], routeStops[j]);
            const scan = await sr.entities.Scan.create({
              product_id: p.id,
              product_name: p.name,
              origin: p.route?.[0]?.country || "",
              labour_pct: p.split?.labour?.pct?.mid ?? 0,
              price: p.markets?.[market]?.price ?? it.unit_price,
              currency: p.markets?.[market]?.currency || (market === "SG" ? "SGD" : "GBP"),
              market,
              confidence: p.confidence || "low",
              basis: "Estimated",
              owner_id: record.created_by_id,
              visibility: "private",
              source: "receipt",
              receipt_id: receiptId,
              brand: p.brand || it.brand || "",
              trace_json: JSON.stringify(p),
              route_json: JSON.stringify((p.route || []).map((s) => ({ stage: s.stage, country: s.country, basis: s.basis }))),
              distance_km: Math.round(km),
              labour_amount: ((p.markets?.[market]?.price ?? it.unit_price) * (p.split?.labour?.pct?.mid ?? 0)) / 100,
              story_status: "pending",
            });
            it.status = "traced";
            it.scan_id = scan.id;
            it.name = p.name;
          }
        } catch {
          it.status = "failed";
        }
        // Persist progress after each item so the UI can show live updates.
        await sr.entities.Receipt.update(rid, { items });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    await sr.entities.Receipt.update(rid, { status: "done", items });
    return Response.json({ ok: true });
  } catch (error) {
    if (receiptId) {
      try {
        await base44.asServiceRole.entities.Receipt.update(receiptId, { status: "failed", error: (error as Error).message });
      } catch {}
    }
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
