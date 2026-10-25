// Ink line-drawing "specimens" — replaces product emojis/photo icons across the app.
// id: "hoodie" | "trainers" | "coffee" | "phone_case" (falls back to hoodie paths).
DRAWINGS.tag = (
  <g fill="none" stroke="var(--j-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    {/* luggage tag */}
    <path d="M 60 60 L 140 60 L 152 150 L 48 150 Z" />
    <circle cx="100" cy="52" r="14" />
    <path d="M 92 58 C 88 44, 112 44, 108 58" strokeWidth="3" />
    <path d="M 70 86 L 130 86 M 70 100 L 118 100 M 70 114 L 124 114" strokeWidth="3" />
    <path d="M 70 132 L 96 132" strokeWidth="3" />
  </g>
);

const DRAWINGS = {
  hoodie: (
    <g fill="none" stroke="var(--j-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 78 40 C 78 16, 122 16, 122 40 C 122 52, 112 58, 100 58 C 88 58, 78 52, 78 40 Z" />
      <path d="M 86 42 C 86 26, 114 26, 114 42" strokeWidth="3" />
      <path d="M 78 44 C 60 50, 44 62, 38 82 L 30 140 L 52 144 L 56 118 L 56 168 L 144 168 L 144 118 L 148 144 L 170 140 L 162 82 C 156 62, 140 50, 122 44" />
      <path d="M 30 140 L 52 144 M 148 144 L 170 140" strokeWidth="3" />
      <path d="M 92 60 C 90 74, 92 82, 90 92 M 108 60 C 110 74, 108 82, 110 92" strokeWidth="3.5" />
      <circle cx="90" cy="94" r="3" fill="var(--j-ink)" />
      <circle cx="110" cy="94" r="3" fill="var(--j-ink)" />
      <path d="M 74 132 L 126 132 L 118 160 L 82 160 Z" strokeWidth="3.5" />
      <path d="M 56 160 L 144 160" strokeWidth="2.5" strokeDasharray="6 8" />
    </g>
  ),
  trainers: (
    <g fill="none" stroke="var(--j-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* sole */}
      <path d="M 24 136 C 60 148, 140 148, 178 132 L 180 148 C 140 164, 58 164, 22 148 Z" />
      <path d="M 24 142 C 60 154, 140 154, 178 140" strokeWidth="2.5" strokeDasharray="5 7" />
      {/* upper */}
      <path d="M 30 136 C 34 96, 48 78, 66 74 C 84 70, 92 86, 104 92 C 120 100, 140 96, 156 106 C 168 114, 172 124, 172 134" />
      {/* heel + collar */}
      <path d="M 30 136 C 26 118, 30 96, 40 84 M 66 74 C 60 60, 52 58, 46 66" />
      {/* laces */}
      <path d="M 88 86 L 104 78 M 96 94 L 112 86 M 104 102 L 120 94" strokeWidth="3.5" />
      {/* toe cap */}
      <path d="M 140 100 C 152 106, 162 118, 164 132" strokeWidth="3" />
    </g>
  ),
  coffee: (
    <g fill="none" stroke="var(--j-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* bag body */}
      <path d="M 52 66 L 148 66 L 156 168 L 44 168 Z" />
      {/* folded top */}
      <path d="M 52 66 L 60 46 L 140 46 L 148 66" />
      <path d="M 60 46 C 80 52, 120 52, 140 46" strokeWidth="3" />
      <path d="M 70 46 L 66 34 L 134 34 L 130 46" />
      {/* label */}
      <rect x="68" y="96" width="64" height="44" strokeWidth="3.5" />
      <path d="M 76 106 L 124 106 M 76 114 L 112 114" strokeWidth="3" />
      {/* coffee bean */}
      <ellipse cx="100" cy="130" rx="12" ry="8" strokeWidth="3" />
      <path d="M 94 126 C 98 128, 102 132, 106 134" strokeWidth="2.5" />
      {/* side gusset hint */}
      <path d="M 52 66 C 48 100, 46 136, 44 168 M 148 66 C 152 100, 154 136, 156 168" strokeWidth="2.5" strokeDasharray="5 8" />
    </g>
  ),
  phone_case: (
    <g fill="none" stroke="var(--j-ink)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {/* case body */}
      <rect x="56" y="22" width="88" height="146" rx="18" />
      <rect x="66" y="34" width="68" height="122" rx="10" strokeWidth="2.5" strokeDasharray="4 7" />
      {/* camera island */}
      <rect x="66" y="34" width="34" height="34" rx="9" />
      <circle cx="78" cy="46" r="5" strokeWidth="3" />
      <circle cx="91" cy="57" r="4" strokeWidth="3" />
      <circle cx="88" cy="44" r="1.5" fill="var(--j-ink)" />
      {/* buttons */}
      <path d="M 56 62 L 52 62 L 52 78 L 56 78 M 144 84 L 148 84 L 148 104 L 144 104" strokeWidth="3" />
      {/* bottom speaker holes */}
      <path d="M 82 162 L 118 162" strokeWidth="3" strokeDasharray="3 6" />
    </g>
  ),
};

const CATEGORY_FALLBACK = [
  [/hood|jumper|sweater|apparel|shirt|cloth|garment|denim|jacket|tee/i, "hoodie"],
  [/shoe|sneaker|trainer|footwear|boot/i, "trainers"],
  [/coffee|tea|food|drink|bean|snack|grocery/i, "coffee"],
  [/phone|case|electronic|gadget|accessor|charg|earbud|cable/i, "phone_case"],
];

function resolveId({ id, product, category }) {
  if (id && DRAWINGS[id]) return id;
  const p = product || {};
  const pid = p.id || id;
  if (pid && DRAWINGS[pid]) return pid;
  const hay = `${p.category || category || ""} ${p.name || ""}`;
  for (const [re, key] of CATEGORY_FALLBACK) if (re.test(hay)) return key;
  return "tag";
}

export default function Specimen({ id, product, category, className = "", title = null }) {
  const resolved = resolveId({ id, product, category });
  return (
    <svg
      viewBox="0 0 200 190"
      className={className}
      role="img"
      aria-label={title || `${resolved} illustration`}
    >
      {DRAWINGS[resolved]}
    </svg>
  );
}
