const task = await takeOverTaskSpace(2);
const page = task.userPage() ?? task.page("p1");
console.log({ url: await page.url(), title: await page.title() });
// capture console + page errors via CDP
try { await page.cdp("Runtime.enable"); } catch (e) { console.log("rt", String(e)); }
try { await page.cdp("Log.enable"); } catch (e) { console.log("log", String(e)); }
await page.goto("https://jejak.base44.app/journal");
await page.waitForTimeout(2500);
console.log(await page.snapshot());
