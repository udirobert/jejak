const task = await taskSpace("jejak-contra-video");
const page = task.page("p1");
await page.goto("https://jejak.base44.app");
console.log({ spaceId: task.spaceId, title: await page.title(), url: await page.url() });
console.log(await page.info());

// Probe: does CDP screencast work and do frames surface via page.events()?
try {
  const r = await page.cdp("Page.startScreencast", {
    format: "jpeg",
    quality: 80,
    everyNthFrame: 1,
  });
  console.log({ startScreencast: r });
} catch (e) {
  console.log({ startScreencastError: String(e) });
}
await page.mouse.wheel(0, 400, { label: "scroll landing page" });
await page.waitForTimeout(2500);
try {
  const evts = await page.events();
  console.log({ eventCount: evts?.length ?? null, sample: evts?.slice?.(0, 3) });
} catch (e) {
  console.log({ eventsError: String(e) });
}
try {
  const r2 = await page.cdp("Page.stopScreencast");
  console.log({ stopScreencast: r2 });
} catch (e) {
  console.log({ stopScreencastError: String(e) });
}
