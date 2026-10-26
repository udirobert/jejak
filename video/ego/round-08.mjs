const task = await taskSpace(1);
const page = task.page("p1");
await page.goto("https://jejak.base44.app/journal");
await page.waitForTimeout(2500);
console.log({ url: await page.url() });
const snap = await page.snapshot();
console.log(snap.includes("Sign in") ? "SIGNED OUT" : "SIGNED IN?");
console.log(snap.slice(0, 3000));
