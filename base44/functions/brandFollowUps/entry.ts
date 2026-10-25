import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";

// Scheduled daily: remind users about brand letters they marked "sent" that
// haven't had a reply and whose reminder is due.
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();
    const candidates = await base44.asServiceRole.entities.BrandRequest.filter({ status: "sent" }, "-created_date", 200);
    const due = (candidates || [])
      .filter((r) => !r.reminded && r.remind_at && r.remind_at <= now)
      .slice(0, 50);

    let sent = 0;
    const errors = [];
    for (const rec of due) {
      try {
        const appUrl = Deno.env.get("JEJAK_APP_URL");
        const cta = appUrl
          ? `<p style="margin-top:18px"><a href="${appUrl}/journal" style="color:#C8442B">Open your journal</a></p>`
          : "";
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: rec.created_by,
          from_name: "Jejak",
          subject: `Has ${rec.brand} replied?`,
          body: `
            <div style="background:#F3EDE2;padding:28px;font-family:Georgia,serif;color:#1E1B16">
              <p style="font-family:monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#C8442B;margin:0 0 8px">Jejak · two weeks later</p>
              <h2 style="font-family:Georgia,serif;font-style:italic;margin:0 0 12px">Has ${rec.brand} replied?</h2>
              <p style="font-family:Georgia,serif;font-size:14px;line-height:1.5;color:#5B544A">
                You sent them a letter about your ${rec.product_name}: <em>"${rec.subject}"</em>.
                If they haven't answered, a gentle nudge is fair — or mark it replied in your journal.
              </p>
              ${cta}
            </div>`,
        });
        await base44.asServiceRole.entities.BrandRequest.update(rec.id, { reminded: true });
        sent++;
      } catch (e) {
        errors.push({ id: rec.id, error: (e as Error).message });
      }
    }
    return Response.json({ ok: true, sent, attempted: due.length, errors: errors.slice(0, 10) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
