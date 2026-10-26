const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
const task = await taskSpace(1);
const page = task.userPage() ?? task.page("p1");
console.log({ url: await page.url() });

await lib.stageViewport(page, { w: 1440, h: 900 });
await lib.injectCursor(page);

// ---- a01-hero: landing hero, route + stamps land ----
await page.goto("https://jejak.base44.app/");
await page.waitForLoadState();
await page.waitForTimeout(800);
let rec = lib.makeRecorder(page, "a01-hero");
await rec.start();
await page.waitForTimeout(6500); // hero animations play out
console.log("a01 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a01-hero.mp4");

// ---- a02-scroll: Follow one hoodie scroll story ----
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
rec = lib.makeRecorder(page, "a02-scroll");
await rec.start();
// scroll to the story section start, then walk it slowly
const storyY = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((x) => x.textContent.includes("Follow one hoodie"));
  return h ? h.getBoundingClientRect().top + window.scrollY - 200 : 600;
});
await lib.smoothScroll(page, storyY, 1600);
await page.waitForTimeout(600);
// walk further through the scroll-driven story
const deepY = await page.evaluate(() => document.body.scrollHeight);
await lib.smoothScroll(page, Math.min(storyY + 2400, deepY), 5200);
await page.waitForTimeout(800);
console.log("a02 frames:", await rec.stop());
await rec.assemble("/Users/udingethe/Dev/jejak/video/raw/a02-scroll.mp4");
