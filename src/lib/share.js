// Sharing a trace.
//
// The point of a shared link is that it IS the thing. "Challenge a friend to
// beat it" used to share the app's root URL, so the person you sent it to
// landed on the landing page with nothing to beat. Every shared link now
// points at the entry itself.

export const APP_URL = "https://jejak.base44.app";

// Where the app is actually served.
//
// Derived from the browser at runtime, with the deployed domain as the
// fallback. Hardcoding it in two places is how the share links ended up
// pointing at a dead host in the first place — there is now one constant,
// and it is only used if there is no window to read.
export function appOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return APP_URL;
}

// The public route for one trace. Short, because it goes into a text message.
export function traceUrl(scanId) {
  if (!scanId) return appOrigin();
  return `${appOrigin()}/t/${scanId}`;
}

export function tracePath(scanId) {
  return scanId ? `/t/${scanId}` : "/trace";
}

// Client-side page metadata.
//
// Honest limitation: social crawlers don't run JavaScript, so they won't see
// these tags. What carries the preview is the share card image the app
// renders itself (the field receipt and the story postcard). A real
// server-rendered OG card would need a prerender step this stack doesn't
// have yet.
export function setPageMeta({ title, description, url, image }) {
  if (typeof document === "undefined") return;
  if (title) document.title = title;

  const set = (selector, attr, value) => {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, selector.includes("property=") ? "property" : "name");
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };

  set('meta[name="description"]', "name", description);
  set('meta[property="og:title"]', "property", title);
  set('meta[property="og:description"]', "property", description);
  set('meta[property="og:url"]', "property", url);
  set('meta[property="og:type"]', "property", "article");
  set('meta[name="twitter:title"]', "name", title);
  set('meta[name="twitter:description"]', "name", description);
  set('meta[name="twitter:image"]', "name", image);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (url) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }
}

// Reset the metadata when leaving a shared trace, so the next page doesn't
// inherit the last trace's title.
export function resetPageMeta() {
  setPageMeta({
    title: "Jejak — a field journal for the things you own",
    description:
      "Every thing has a journey. Jejak is a field journal for the things you own: snap anything to see where it came from, who made it, and where your money went.",
    url: appOrigin(),
  });
}
