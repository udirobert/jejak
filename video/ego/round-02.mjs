const fs = await import("node:fs/promises");
const task = await taskSpace(2);
const page = task.page("p1");

// Force a deterministic 1440x900 viewport for recording.
await page.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
});
await page.reload();
await page.waitForLoadState();
await page.waitForTimeout(1500);

await page.cdp("Page.startScreencast", { format: "jpeg", quality: 82, everyNthFrame: 1 });

const frames = [];
const t0 = Date.now();
while (Date.now() - t0 < 4000) {
  await page.mouse.wheel(0, 300);
  const evts = await page.events();
  for (const e of evts) {
    if (e.method === "Page.screencastFrame") {
      frames.push(e.params);
      await page.cdp("Page.screencastFrameAck", { sessionId: e.params.sessionId }).catch(() => {});
    }
  }
}
await page.cdp("Page.stopScreencast");
console.log({ frames: frames.length, meta: frames[0]?.metadata });
if (frames[0]) {
  await fs.writeFile("/Users/udingethe/Dev/jejak/video/raw/screencast-test.jpg", Buffer.from(frames[frames.length - 1].data, "base64"));
}
await page.cdp("Emulation.clearDeviceMetricsOverride");
console.log(await page.snapshot({ scope: "only_within_viewport" }));
