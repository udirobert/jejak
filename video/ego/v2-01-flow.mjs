const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace("jejak-vid-v2");
const page = task.page("p1");
const DIR = "/Users/udingethe/Dev/jejak/video";
await page.cdp("Page.bringToFront").catch(() => {});
await lib.stageViewport(page, { w: 1440, h: 900 });

// ---- v2-flow-intro: identifying polaroid -> sketch -> IDENTIFIED -> journey draw-on ----
// One continuous clip so the first frames of the route draw-on aren't lost.
// `journeyAt` is the offset (s) into the mp4 where the journey screen mounted.
await page.goto("https://jejak.base44.app/trace?sample=hoodie");
await page.waitForLoadState();
await lib.injectCursor(page);
await page.mouse.wheel(0, 80);

let rec = lib.makeRecorder(page, "v2-flow-intro");
await rec.start();
const t0 = Date.now();
let journeyAt = -1;
for (let i = 0; i < 40; i++) {
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
// let the draw-on + postmarks + card light-up play out
await page.waitForTimeout(12000);
console.log("flow-intro frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-flow-intro.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-flow-intro-end.png` });

// ---- v2-split: guess slider -> reveal orbs ----
await lib.cursorClick(page, "text=Where did the").catch(async () => {
  await lib.cursorClick(page, "text=money");
});
await page.waitForTimeout(1800);
await page.mouse.wheel(0, 100);
rec = lib.makeRecorder(page, "v2-split");
await rec.start();
await page.evaluate(async () => {
  const el = document.querySelector('input[type="range"]');
  if (!el) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  for (let v = 15; v >= 4; v--) {
    setter.call(el, String(v));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 90));
  }
});
await page.waitForTimeout(400);
await lib.cursorClick(page, "text=Reveal the split");
await page.waitForTimeout(6500);
console.log("split frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-split.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-split-end.png` });

// ---- v2-letter: Ask the brand -> drafted transparency letter + follow-up chip ----
await page.mouse.wheel(0, 60);
rec = lib.makeRecorder(page, "v2-letter");
await rec.start();
await lib.cursorClick(page, "text=Ask the brand");
await page.waitForTimeout(2500);
// let the drafted letter read, then a slow scroll inside the sheet if scrollable
await page.evaluate(() => {
  const sheet = [...document.querySelectorAll("div")].find(
    (d) => d.scrollHeight > d.clientHeight + 40 && d.innerText.includes("transparency"),
  );
  sheet?.scrollTo({ top: 220, behavior: "smooth" });
});
await page.waitForTimeout(3500);
console.log("letter frames:", await rec.stop());
await rec.assemble(`${DIR}/raw/v2-letter.mp4`);
await page.screenshot({ path: `${DIR}/raw/v2-letter-end.png` });
await page.keyboard?.press("Escape").catch(() => {});
