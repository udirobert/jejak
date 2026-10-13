import { ORIGIN_COORDS } from "./exploreUtils";

// App category colours for ship containers
export const CONTAINER_COLORS = [
  ["#2FBF71", "#FF7A1A", "#2D5BFF"], // materials, labour, freight
  ["#FF7A1A", "#FFC24B", "#8B5CF6"], // labour, gold, brand
  ["#2D5BFF", "#2FBF71", "#FF3D81"], // freight, materials, retail
  ["#8B5CF6", "#FF3D81", "#FFC24B"], // brand, retail, gold
];

// 8 simplified global trade lanes (lon, lat waypoints in open water)
// Illustrative routes only — no real vessel names or live tracking
export const AMBIENT_SHIP_LANES = [
  {
    id: "lane-malacca-scs",
    speed: 0.022,
    phase: 0.08,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [88.0, 6.0],
      [96.5, 5.2],
      [103.8, 1.2],
      [111.5, 9.5],
      [119.5, 21.5],
    ],
  },
  {
    id: "lane-indian-suez",
    speed: 0.018,
    phase: 0.34,
    containers: CONTAINER_COLORS[1],
    waypoints: [
      [78.0, 5.5],
      [63.0, 10.5],
      [48.5, 12.2],
      [43.2, 13.5],
      [34.0, 27.2],
    ],
  },
  {
    id: "lane-med-uk",
    speed: 0.021,
    phase: 0.62,
    containers: CONTAINER_COLORS[2],
    waypoints: [
      [31.5, 32.2],
      [16.0, 35.8],
      [-5.6, 35.9],
      [-10.2, 42.5],
      [-4.5, 49.8],
    ],
  },
  {
    id: "lane-cape-good-hope",
    speed: 0.016,
    phase: 0.19,
    containers: CONTAINER_COLORS[3],
    waypoints: [
      [58.0, -16.0],
      [37.0, -29.0],
      [18.2, -36.2],
      [6.0, -21.0],
      [-6.0, -2.0],
    ],
  },
  {
    id: "lane-east-africa-malacca",
    speed: 0.019,
    phase: 0.51,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [43.5, -2.0],
      [62.0, 0.5],
      [80.5, 4.0],
      [95.5, 5.0],
      [103.5, 1.3],
    ],
  },
  {
    id: "lane-trans-pacific",
    speed: 0.017,
    phase: 0.77,
    containers: CONTAINER_COLORS[1],
    waypoints: [
      [123.0, 24.0],
      [138.0, 31.0],
      [158.0, 36.5],
      [177.0, 38.0],
    ],
  },
  {
    id: "lane-north-atlantic",
    speed: 0.02,
    phase: 0.43,
    containers: CONTAINER_COLORS[2],
    waypoints: [
      [-68.0, 37.5],
      [-46.0, 42.5],
      [-24.0, 47.0],
      [-6.0, 50.2],
    ],
  },
  {
    id: "lane-bengal-singapore",
    speed: 0.024,
    phase: 0.88,
    containers: CONTAINER_COLORS[3],
    waypoints: [
      [90.2, 20.5],
      [93.0, 13.0],
      [97.5, 6.2],
      [103.8, 1.3],
    ],
  },
];

// Capped 6 subtle ocean wave shimmer coordinates [lon, lat]
export const WAVE_SHIMMER_SPOTS = [
  [68.0, -8.0],
  [86.0, 11.0],
  [-28.0, 26.0],
  [14.0, -26.0],
  [134.0, 16.0],
  [52.0, 15.0],
];

// Open-ocean spots where the rare whale/shark fin can surface
export const CREATURE_SPOTS = [
  { coords: [66.0, -6.0], kind: "whale" },
  { coords: [-24.0, 30.0], kind: "fin" },
  { coords: [88.0, 10.0], kind: "whale" },
  { coords: [132.0, 18.0], kind: "fin" },
  { coords: [10.0, -24.0], kind: "whale" },
];

// Candidate origins shown as pulsing "?" dots when they have no traces yet
export const UNTRACED_CANDIDATE_ORIGINS = [
  "India",
  "Indonesia",
  "Turkey",
  "Portugal",
  "Peru",
  "Morocco",
];

// Build illustrative maritime route from an origin country to UK ("GB") or Singapore ("SG")
export function buildOriginToMarketWaypoints(origin, market = "GB") {
  const start = ORIGIN_COORDS[origin] || [90.35, 23.68];
  const isSG = market === "SG";
  const dest = isSG ? [103.82, 1.35] : [-1.4, 50.9];

  if (isSG) {
    switch (origin) {
      case "Bangladesh":
      case "India":
        return [start, [92.0, 13.5], [98.0, 5.5], dest];
      case "Vietnam":
      case "China":
        return [start, [112.5, 12.0], [106.5, 4.0], dest];
      case "Ethiopia":
      case "Kenya":
        return [start, [52.0, 10.5], [76.0, 5.5], [96.0, 5.2], dest];
      case "Indonesia":
        return [start, [108.0, -3.5], dest];
      default:
        return [start, [65.0, 8.0], [95.0, 5.5], dest];
    }
  }

  // Destination: UK ("GB")
  switch (origin) {
    case "Bangladesh":
      return [
        start,
        [82.0, 6.0],
        [45.0, 12.5],
        [32.5, 30.5],
        [-5.5, 36.0],
        [-9.5, 43.5],
        dest,
      ];
    case "Vietnam":
    case "China":
    case "Indonesia":
      return [
        start,
        [104.0, 1.3],
        [80.0, 6.0],
        [45.0, 12.5],
        [32.5, 30.5],
        [-5.5, 36.0],
        [-9.5, 43.5],
        dest,
      ];
    case "Ethiopia":
    case "Kenya":
      return [
        start,
        [43.5, 13.0],
        [32.5, 30.5],
        [14.0, 36.5],
        [-5.5, 36.0],
        [-9.5, 43.5],
        dest,
      ];
    case "India":
      return [
        start,
        [64.0, 15.0],
        [44.5, 12.5],
        [32.5, 30.5],
        [-5.5, 36.0],
        [-9.5, 43.5],
        dest,
      ];
    case "Turkey":
      return [start, [18.0, 36.0], [-5.5, 36.0], [-9.5, 43.5], dest];
    case "Portugal":
    case "Morocco":
      return [start, [-10.5, 43.0], dest];
    case "Peru":
    case "Colombia":
      return [start, [-79.5, 9.0], [-42.0, 32.0], [-12.0, 46.0], dest];
    default:
      return [start, [32.5, 30.5], [-5.5, 36.0], dest];
  }
}

// Interpolate along a projected 2D polyline (0 <= t <= 1) and return position + heading angle
export function sampleProjectedPolyline(pts, t) {
  if (!pts || pts.length === 0) return null;
  if (pts.length === 1) return { x: pts[0][0], y: pts[0][1], angle: 0 };

  const clampedT = Math.max(0, Math.min(1, t));
  const segLengths = [];
  let totalLen = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dy);
    segLengths.push(len);
    totalLen += len;
  }

  if (totalLen <= 0.001) {
    return { x: pts[0][0], y: pts[0][1], angle: 0 };
  }

  const targetDist = clampedT * totalLen;
  let accum = 0;

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (accum + segLen >= targetDist || i === segLengths.length - 1) {
      const localT = segLen > 0 ? (targetDist - accum) / segLen : 0;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * localT;
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * localT;
      const angle =
        (Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) *
          180) /
        Math.PI;
      return { x, y, angle };
    }
    accum += segLen;
  }

  const last = pts[pts.length - 1];
  return { x: last[0], y: last[1], angle: 0 };
}