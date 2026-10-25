import React from "react";

// Crisp vector SVG flags for every supply-chain country in Jejak (zero emoji).
export function VectorFlagSvg({ country, className = "h-3.5 w-5" }) {
  switch (country) {
    case "Bangladesh":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="14" fill="#006A4E" />
          <circle cx="9" cy="7" r="4.2" fill="#F42A41" />
        </svg>
      );
    case "Vietnam":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="14" fill="#DA251D" />
          <polygon
            points="10,2.6 11.1,6 14.7,6 11.8,8.1 12.9,11.5 10,9.4 7.1,11.5 8.2,8.1 5.3,6 8.9,6"
            fill="#FFFF00"
          />
        </svg>
      );
    case "Ethiopia":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="4.67" y="0" fill="#078930" />
          <rect width="20" height="4.67" y="4.67" fill="#FCDD09" />
          <rect width="20" height="4.66" y="9.34" fill="#DA121A" />
          <circle cx="10" cy="7" r="3.1" fill="#0F47AF" />
          <circle cx="10" cy="7" r="1.6" fill="none" stroke="#FCDD09" strokeWidth="0.8" />
        </svg>
      );
    case "China":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="14" fill="#EE1C25" />
          <polygon
            points="4.2,2.2 4.8,4 6.7,4 5.2,5.1 5.7,6.9 4.2,5.8 2.7,6.9 3.2,5.1 1.7,4 3.6,4"
            fill="#FFFF00"
          />
          <circle cx="8.2" cy="2.3" r="0.65" fill="#FFFF00" />
          <circle cx="9.4" cy="3.8" r="0.65" fill="#FFFF00" />
          <circle cx="9.3" cy="5.7" r="0.65" fill="#FFFF00" />
          <circle cx="8.0" cy="7.2" r="0.65" fill="#FFFF00" />
        </svg>
      );
    case "Cambodia":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="3.5" y="0" fill="#032EA1" />
          <rect width="20" height="7" y="3.5" fill="#E00025" />
          <rect width="20" height="3.5" y="10.5" fill="#032EA1" />
          <path d="M6.5 9.2 H13.5 L12.7 6.5 L11.4 7.3 L10 5 L8.6 7.3 L7.3 6.5 Z" fill="#FFFFFF" />
        </svg>
      );
    case "Indonesia":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="7" y="0" fill="#FF0000" />
          <rect width="20" height="7" y="7" fill="#FFFFFF" />
        </svg>
      );
    case "India":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="4.67" y="0" fill="#FF9933" />
          <rect width="20" height="4.67" y="4.67" fill="#FFFFFF" />
          <rect width="20" height="4.66" y="9.34" fill="#138808" />
          <circle cx="10" cy="7" r="1.7" fill="none" stroke="#000080" strokeWidth="0.9" />
        </svg>
      );
    case "Singapore":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="7" y="0" fill="#EF3340" />
          <rect width="20" height="7" y="7" fill="#FFFFFF" />
          <circle cx="5.2" cy="3.5" r="2.1" fill="#FFFFFF" />
          <circle cx="6.0" cy="3.5" r="1.8" fill="#EF3340" />
        </svg>
      );
    case "Netherlands":
    case "NL":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="4.67" y="0" fill="#AE1C28" />
          <rect width="20" height="4.67" y="4.67" fill="#FFFFFF" />
          <rect width="20" height="4.66" y="9.34" fill="#21468B" />
        </svg>
      );
    case "United Kingdom":
    case "UK":
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="14" fill="#012169" />
          <path d="M0,0 L20,14 M20,0 L0,14" stroke="#FFFFFF" strokeWidth="2.4" />
          <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M10,0 V14 M0,7 H20" stroke="#FFFFFF" strokeWidth="3.8" />
          <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 14" className={`${className} rounded-[2px] shrink-0`} aria-hidden="true">
          <rect width="20" height="14" fill="#2D5BFF" />
          <circle cx="10" cy="7" r="4" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
      );
  }
}

// Inline SVG flag group for rendering directly inside an <svg> map canvas at (x, y)
export function MapSvgFlag({ country, x = 0, y = 0, width = 14, height = 10 }) {
  const rx = 2;
  const gx = x - width / 2;
  const gy = y - height / 2;
  return (
    <g transform={`translate(${gx}, ${gy})`}>
      <rect
        width={width}
        height={height}
        rx={rx}
        fill="#0F2544"
        stroke="#FFFFFF"
        strokeWidth="0.9"
      />
      <svg width={width} height={height} viewBox="0 0 20 14">
        {country === "Bangladesh" && (
          <>
            <rect width="20" height="14" rx="2" fill="#006A4E" />
            <circle cx="9" cy="7" r="4.2" fill="#F42A41" />
          </>
        )}
        {country === "Vietnam" && (
          <>
            <rect width="20" height="14" rx="2" fill="#DA251D" />
            <polygon
              points="10,2.6 11.1,6 14.7,6 11.8,8.1 12.9,11.5 10,9.4 7.1,11.5 8.2,8.1 5.3,6 8.9,6"
              fill="#FFFF00"
            />
          </>
        )}
        {country === "Ethiopia" && (
          <>
            <rect width="20" height="4.67" y="0" fill="#078930" />
            <rect width="20" height="4.67" y="4.67" fill="#FCDD09" />
            <rect width="20" height="4.66" y="9.34" fill="#DA121A" />
            <circle cx="10" cy="7" r="3" fill="#0F47AF" />
          </>
        )}
        {country === "China" && (
          <>
            <rect width="20" height="14" rx="2" fill="#EE1C25" />
            <circle cx="5" cy="4.8" r="2.2" fill="#FFFF00" />
          </>
        )}
        {country === "Cambodia" && (
          <>
            <rect width="20" height="3.5" y="0" fill="#032EA1" />
            <rect width="20" height="7" y="3.5" fill="#E00025" />
            <rect width="20" height="3.5" y="10.5" fill="#032EA1" />
            <rect x="7" y="5.2" width="6" height="3.6" fill="#FFFFFF" />
          </>
        )}
        {country === "Indonesia" && (
          <>
            <rect width="20" height="7" y="0" fill="#FF0000" />
            <rect width="20" height="7" y="7" fill="#FFFFFF" />
          </>
        )}
        {country === "India" && (
          <>
            <rect width="20" height="4.67" y="0" fill="#FF9933" />
            <rect width="20" height="4.67" y="4.67" fill="#FFFFFF" />
            <rect width="20" height="4.66" y="9.34" fill="#138808" />
          </>
        )}
        {!["Bangladesh", "Vietnam", "Ethiopia", "China", "Cambodia", "Indonesia", "India"].includes(
          country
        ) && <rect width="20" height="14" rx="2" fill="#2D5BFF" />}
      </svg>
    </g>
  );
}

// Shared Flag-Chip component used across both Explore and Bank
export default function OriginFlagChip({
  country,
  countries,
  showLabel = false,
  labelOverride,
  active = false,
  variant = "subtle", // "subtle" | "solid" | "jejak-hero"
  size = "sm", // "xs" | "sm" | "md"
  onClick,
  title,
  className = "",
}) {
  const list =
    Array.isArray(countries) && countries.length > 0
      ? countries
      : country
      ? [country]
      : [];

  const shortName = (c) =>
    c === "United Kingdom" ? "UK" : c === "Netherlands" ? "NL" : c;

  const flagSizeClass =
    size === "md"
      ? "h-4 w-[22px]"
      : size === "xs"
      ? "h-3 w-4"
      : "h-3.5 w-5";

  const baseTone =
    variant === "jejak-hero"
      ? "bg-gradient-to-r from-[#FF8A65] via-[#FFC24B] to-[#FF3D81] p-[1.5px] shadow-[0_4px_14px_rgba(255,138,101,0.32)]"
      : active || variant === "solid"
      ? "bg-jejak-navy text-white border border-jejak-navy shadow-sm"
      : "bg-white/90 text-jejak-navy border border-jejak-navy/12 shadow-sm";

  const Tag = onClick ? "button" : "span";

  if (variant === "jejak-hero") {
    return (
      <Tag
        type={onClick ? "button" : undefined}
        onClick={onClick}
        title={title || `Trace ${list.join(" → ")}`}
        className={`inline-flex items-center rounded-full no-tap transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/60 ${baseTone} ${className}`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFDF9] px-2.5 py-1 text-[11px] font-extrabold text-jejak-navy">
          <span className="inline-flex items-center -space-x-1">
            {list.map((c) => (
              <span
                key={c}
                className="inline-flex items-center justify-center rounded-[3px] ring-1 ring-white shadow-sm overflow-hidden"
              >
                <VectorFlagSvg country={c} className={flagSizeClass} />
              </span>
            ))}
          </span>
          <span>{labelOverride || "Trace"}</span>
        </span>
      </Tag>
    );
  }

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title || list.join(", ")}
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold no-tap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-jejak-navy/60 ${baseTone} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {list.map((c) => (
          <span
            key={c}
            className="inline-flex items-center justify-center rounded-[2px] overflow-hidden shadow-[0_0_0_1px_rgba(27,27,58,0.12)]"
          >
            <VectorFlagSvg country={c} className={flagSizeClass} />
          </span>
        ))}
      </span>
      {showLabel && (
        <span className="leading-none">
          {labelOverride || list.map(shortName).join(" · ")}
        </span>
      )}
    </Tag>
  );
}