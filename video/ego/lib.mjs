// Shared recording rig for ego-browser rounds.
// Import with: const lib = await import("file:///Users/udingethe/Dev/jejak/video/ego/lib.mjs");
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
const execFileP = promisify(execFile);

export const DIR = "/Users/udingethe/Dev/jejak/video";

export function makeRecorder(page, name) {
  const dir = `${DIR}/raw/${name}`;
  const frames = [];
  let draining = false;
  let timer = null;

  async function drain() {
    if (draining) return;
    draining = true;
    try {
      const evts = await page.events();
      for (const e of evts) {
        if (e.method === "Page.screencastFrame") {
          frames.push(e.params);
          page.cdp("Page.screencastFrameAck", { sessionId: e.params.sessionId }).catch(() => {});
        }
      }
    } catch {}
    draining = false;
  }

  return {
    async start() {
      await fs.mkdir(dir, { recursive: true });
      await page.cdp("Page.startScreencast", { format: "jpeg", quality: 85, everyNthFrame: 1 });
      timer = setInterval(drain, 120);
    },
    async drain() { await drain(); },
    frames,
    async stop() {
      clearInterval(timer);
      await drain();
      await page.cdp("Page.stopScreencast").catch(() => {});
      // Write frames + concat list keyed off monotonic timestamps
      const list = [];
      let prev = null;
      for (let i = 0; i < frames.length; i++) {
        const f = `${dir}/f-${String(i).padStart(5, "0")}.jpg`;
        await fs.writeFile(f, Buffer.from(frames[i].data, "base64"));
        const ts = frames[i].metadata?.monotonicTimestamp ?? i / 30;
        if (prev) prev.dur = Math.min(Math.max(ts - prev.ts, 0.001), 2.0);
        prev = { f, ts, dur: 0.04 };
        list.push(prev);
      }
      const concat = list.map((x) => `file '${x.f}'\nduration ${x.dur.toFixed(4)}`).join("\n") + `\nfile '${list[list.length - 1].f}'\n`;
      await fs.writeFile(`${dir}/concat.txt`, concat);
      return frames.length;
    },
    async assemble(outPath, fps = 30) {
      await execFileP("ffmpeg", [
        "-y", "-f", "concat", "-safe", "0", "-i", `${dir}/concat.txt`,
        "-vf", `fps=${fps}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", outPath,
      ]);
      return outPath;
    },
  };
}

// Deterministic viewport + injected fake cursor for legible clicks.
export async function stageViewport(page, { w = 1440, h = 900, mobile = false } = {}) {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}

export async function injectCursor(page) {
  await page.evaluate(() => {
    if (window.__cursor) return;
    const dot = document.createElement("div");
    dot.id = "__cursor-dot";
    dot.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:14px;height:14px;border-radius:50%;background:#1E1B16;box-shadow:0 0 0 3px rgba(255,255,255,.85),0 2px 8px rgba(0,0,0,.35);pointer-events:none;transform:translate(-100px,-100px);transition:transform .38s cubic-bezier(.3,.7,.3,1),opacity .2s;opacity:0;";
    const ring = document.createElement("div");
    ring.id = "__cursor-ring";
    ring.style.cssText = "position:fixed;z-index:2147483647;left:0;top:0;width:34px;height:34px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid rgba(200,68,43,.9);pointer-events:none;transform:translate(-100px,-100px) scale(1);opacity:0;";
    document.documentElement.appendChild(dot);
    document.documentElement.appendChild(ring);
    window.__cursor = {
      move(x, y) {
        dot.style.opacity = "1"; ring.style.opacity = "0";
        dot.style.transform = `translate(${x - 7}px,${y - 7}px)`;
        ring.style.transform = `translate(${x - 7}px,${y - 7}px) scale(1)`;
      },
      async click() {
        ring.style.transition = "none"; ring.style.opacity = "1"; ring.style.transform += " scale(1.4)";
        await new Promise((r) => setTimeout(r, 30));
        ring.style.transition = "transform .3s ease-out,opacity .35s"; ring.style.transform = ring.style.transform.replace(" scale(1.4)", " scale(.85)");
        await new Promise((r) => setTimeout(r, 350));
        ring.style.opacity = "0";
      },
      hide() { dot.style.opacity = "0"; ring.style.opacity = "0"; },
    };
  });
}

// Smooth scroll helper: animated scrollTo over `ms` inside the page.
export async function smoothScroll(page, toY, ms = 1400) {
  await page.evaluate(
    ([toY, ms]) =>
      new Promise((resolve) => {
        const from = window.scrollY;
        const start = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        function step(now) {
          const t = Math.min((now - start) / ms, 1);
          window.scrollTo(0, from + (toY - from) * ease(t));
          if (t < 1) requestAnimationFrame(step); else resolve();
        }
        requestAnimationFrame(step);
      }),
    [toY, ms],
  );
}

export async function scrollBySmooth(page, dy, ms = 1200) {
  const y = await page.evaluate(() => window.scrollY);
  await smoothScroll(page, y + dy, ms);
}

// Click helper: fake cursor glides over, ring pulses, DOM click fires.
// DOM click avoids Input.dispatchMouseEvent, which times out while the
// screencast event drain is polling.
export async function cursorClick(page, selector) {
  const box = await page.evaluate((sel) => {
    const el = sel.startsWith("text=")
      ? [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim().includes(sel.slice(5)))
      : document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const r2 = el.getBoundingClientRect();
    return { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 };
  }, selector);
  if (!box) throw new Error("cursorClick: no element " + selector);
  await page.evaluate(([x, y]) => window.__cursor?.move(x, y), [box.x, box.y]);
  await page.waitForTimeout(500);
  const p = page.evaluate(() => window.__cursor?.click());
  await page.evaluate((sel) => {
    const el = sel.startsWith("text=")
      ? [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim().includes(sel.slice(5)))
      : document.querySelector(sel);
    el?.click();
  }, selector);
  await p;
}
