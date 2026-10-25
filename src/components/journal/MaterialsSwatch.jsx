// Printed materials swatch — turns a label fibre_composition string into a
// stacked percentage bar with a tiny Plex Mono legend. Unknown fibres get a
// neutral ink-wash colour. Returns null when no percentages parse, so callers
// can fall back to the raw text line.

const FIBRE_COLORS = [
  [["cotton"], "#B9A98F"],
  [["polyester"], "#7A8B99"],
  [["wool"], "#8F7A5E"],
  [["elastane", "spandex"], "#C9B6A3"],
  [["nylon"], "#8D9A8B"],
  [["viscose", "rayon"], "#A5856C"],
  [["silk"], "#E3D5B8"],
  [["leather"], "#6E4F3A"],
  [["rubber"], "#4A4A48"],
  [["eva"], "#B5B8B1"],
  [["tpu"], "#8FA6B5"],
  [["polycarbonate"], "#6E7E8C"],
  [["arabica", "coffee"], "#6B4E35"],
];
const UNKNOWN_FIBRE_COLOR = "#9C9485";

function fibreColor(name) {
  const lower = name.toLowerCase();
  for (const [keywords, color] of FIBRE_COLORS) {
    if (keywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower))) {
      return color;
    }
  }
  return UNKNOWN_FIBRE_COLOR;
}

// Parses "80% cotton, 20% recycled polyester" style strings into
// [{ name, pct, color }]. Normalizes to 100 when the read pcts are off.
// Returns null if nothing parseable — caller keeps the plain text fallback.
export function parseFibreText(fibreText) {
  if (!fibreText || typeof fibreText !== "string") return null;
  const re = /(\d+(?:\.\d+)?)\s*%\s*([^\d%,;·\n]+)/g;
  const segments = [];
  let m;
  while ((m = re.exec(fibreText)) !== null) {
    const pct = parseFloat(m[1]);
    const name = m[2]
      .replace(/\s+(and|with)$/i, "")
      .replace(/[.,;·\s]+$/, "")
      .trim();
    if (!name || !(pct > 0)) continue;
    segments.push({ name, pct });
  }
  if (segments.length === 0) return null;

  const sum = segments.reduce((acc, s) => acc + s.pct, 0);
  if (Math.abs(sum - 100) > 2 && sum > 0) {
    for (const s of segments) {
      s.pct = Math.round((s.pct / sum) * 1000) / 10;
    }
  }

  return segments.map((s) => ({
    ...s,
    pct: Math.round(s.pct * 10) / 10,
    color: fibreColor(s.name),
  }));
}

export default function MaterialsSwatch({ fibreText }) {
  const segments = parseFibreText(fibreText);
  if (!segments) return null;

  const summary = segments.map((s) => `${s.name} ${s.pct}%`).join(", ");
  return (
    <div className="mt-2 border border-journal-rule/70 bg-journal-card px-2 py-1.5">
      <p className="font-plexmono text-[9px] uppercase tracking-[0.12em] text-journal-ink-soft">
        materials · read from the label
      </p>
      <div
        className="mt-1.5 flex h-3 w-full bg-journal-paper"
        style={{ gap: "1px" }}
        role="img"
        aria-label={`materials: ${summary}`}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
            title={`${s.name} ${s.pct}%`}
          />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 font-plexmono text-[9px] text-journal-ink-soft"
            title={`${s.name} ${s.pct}%`}
          >
            <span
              className="inline-block h-2 w-2 shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="max-w-[140px] truncate">
              {s.name} {s.pct}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
