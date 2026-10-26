const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = await task.newPage();
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });
await page.goto("https://jejak.base44.app/trace");
await page.waitForLoadState();
await page.waitForTimeout(2500);
await lib.injectCursor(page);
await page.mouse.wheel(0, 80);

// ---- v2-describe: "describe it instead" -> form -> Trace it -> journey lands ----
let rec = lib.makeRecorder(page, "v2-describe");
const t0 = Date.now();
await rec.start();
await lib.cursorClick(page, "text=describe it instead");
await page.waitForTimeout(700);
await page.evaluate(async () => {
  const input = [...document.querySelectorAll("form input")][0];
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  const text = "navy wool peacoat, brass buttons";
  for (let i = 1; i <= text.length; i++) {
    setter.call(input, text.slice(0, i));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 45));
  }
});
await page.waitForTimeout(500);
await lib.cursorClick(page, "text=Trace it");
let journeyAt = -1;
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500);
  const onJourney = await page.evaluate(
    () =>
      !!document.querySelector('[aria-label*="Map of the"], [id^="stop-entry"]') ||
      document.body.innerText.includes("stops ·"),
  );
  if (onJourney) {
    journeyAt = (Date.now() - t0) / 1000;
    break;
  }
}
console.log({ journeyAt });
await page.waitForTimeout(7000);
console.log("describe frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-describe.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-describe-end.png` });
