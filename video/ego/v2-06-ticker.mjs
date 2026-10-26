const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });

// Empty-atlas state: 404 the Scan entity read so productGroups is []
// and the corridor ticker renders under the sheet peek line.
await page.cdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u, ...rest) {
      if (typeof u === "string" && u.includes("/entities/Scan")) u = "/__jejak-no-scans__";
      return origOpen.call(this, m, u, ...rest);
    };
    const origFetch = window.fetch;
    window.fetch = (u, ...a) =>
      typeof u === "string" && u.includes("/entities/Scan")
        ? Promise.resolve(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }))
        : origFetch(u, ...a);
  })();`,
});
await page.goto("https://jejak.base44.app/atlas");
await page.waitForLoadState();
await page.waitForTimeout(4000);
await lib.injectCursor(page);
await page.evaluate(() => window.__cursor?.hide());
const tickerOn = await page.evaluate(
  () => (document.body.innerText.match(/→/g) || []).length >= 2 || document.body.innerText.toLowerCase().includes("trace"),
);
console.log({ tickerOn });
await page.screenshot({ path: `${DIR}/raw/v2-ticker-check.png` });
await page.mouse.wheel(0, 60);
let rec = lib.makeRecorder(page, "v2-ticker");
await rec.start();
await page.waitForTimeout(14000); // ~2 lane rotations
console.log("ticker frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-ticker.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-ticker-end.png` });
