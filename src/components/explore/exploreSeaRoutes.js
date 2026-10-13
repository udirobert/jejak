import { ORIGIN_COORDS } from "./exploreUtils";

// App category colours for containers
export const CONTAINER_COLORS = [
  ["#2FBF71", "#FF7A1A", "#2D5BFF"], // materials, labour, freight
  ["#FF7A1A", "#FFC24B", "#8B5CF6"], // labour, gold, brand
  ["#2D5BFF", "#2FBF71", "#FF3D81"], // freight, materials, retail
  ["#8B5CF6", "#FF3D81", "#FFC24B"], // brand, retail, gold
];

// Ambient transport corridors with Level-of-Detail (minZoom)
// At world zoom (minZoom: 1): 5 ocean ships + 2 planes = 7 larger, uncrowded vehicles.
// When zoomed into a region (zoom >= 1.75): trains on overland corridors and lorries on regional land legs appear.
// Total visible animated vehicles is capped at <= 10 at any time.
export const AMBIENT_TRANSPORT_CORRIDORS = [
  // --- WORLD ZOOM: OCEAN SHIPS (5) ---
  {
    id: "ship-malacca-scs",
    mode: "ship",
    minZoom: 1,
    speed: 0.02,
    phase: 0.08,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [86.0, 6.0],
      [96.5, 5.2],
      [103.8, 1.2],
      [112.0, 10.5],
      [120.5, 22.5],
    ],
  },
  {
    id: "ship-indian-suez",
    mode: "ship",
    minZoom: 1,
    speed: 0.017,
    phase: 0.36,
    containers: CONTAINER_COLORS[1],
    waypoints: [
      [78.0, 5.5],
      [62.0, 10.5],
      [45.0, 12.2],
      [33.0, 28.0],
    ],
  },
  {
    id: "ship-med-uk",
    mode: "ship",
    minZoom: 1,
    speed: 0.019,
    phase: 0.64,
    containers: CONTAINER_COLORS[2],
    waypoints: [
      [31.5, 32.0],
      [15.0, 36.0],
      [-5.6, 35.9],
      [-9.8, 43.0],
      [-3.5, 50.2],
    ],
  },
  {
    id: "ship-cape-corridor",
    mode: "ship",
    minZoom: 1,
    speed: 0.015,
    phase: 0.22,
    containers: CONTAINER_COLORS[3],
    waypoints: [
      [56.0, -16.0],
      [35.0, -30.0],
      [18.0, -36.0],
      [5.0, -20.0],
      [-5.0, 0.0],
    ],
  },
  {
    id: "ship-east-africa-asia",
    mode: "ship",
    minZoom: 1,
    speed: 0.018,
    phase: 0.53,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [44.0, -1.5],
      [64.0, 1.5],
      [82.0, 4.5],
      [96.0, 5.0],
      [103.5, 1.3],
    ],
  },

  // --- WORLD ZOOM: LONG-HAUL AIR LEGS (2) ---
  {
    id: "plane-asia-europe",
    mode: "plane",
    minZoom: 1,
    speed: 0.034,
    phase: 0.15,
    containers: CONTAINER_COLORS[1],
    waypoints: [
      [106.5, 14.0],
      [77.0, 26.0],
      [44.0, 38.0],
      [12.0, 48.0],
      [-0.5, 51.5],
    ],
  },
  {
    id: "plane-east-africa-uk",
    mode: "plane",
    minZoom: 1,
    speed: 0.031,
    phase: 0.72,
    containers: CONTAINER_COLORS[3],
    waypoints: [
      [38.8, 9.0],
      [25.0, 26.0],
      [10.0, 42.0],
      [-1.2, 51.2],
    ],
  },

  // --- REGIONAL ZOOM (zoom >= 1.75): OVERLAND FREIGHT TRAINS & SHORT-HAUL LORRIES ---
  {
    id: "train-eurasia-express",
    mode: "train",
    minZoom: 1.75,
    speed: 0.025,
    phase: 0.12,
    containers: CONTAINER_COLORS[2],
    waypoints: [
      [108.9, 34.2], // Xi'an / Chongqing
      [87.6, 43.8],  // Urumqi
      [69.2, 41.3],  // Central Asia
      [37.6, 52.0],  // Eastern Europe
      [10.0, 51.5],  // Duisburg
    ],
  },
  {
    id: "train-india-corridor",
    mode: "train",
    minZoom: 1.75,
    speed: 0.028,
    phase: 0.44,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [88.3, 22.6],
      [79.0, 21.1],
      [72.8, 19.1],
    ],
  },
  {
    id: "lorry-bangladesh-port",
    mode: "lorry",
    minZoom: 1.75,
    speed: 0.032,
    phase: 0.28,
    containers: CONTAINER_COLORS[1],
    waypoints: [
      [90.4, 24.8],
      [90.4, 23.7],
      [91.8, 22.3],
    ],
  },
  {
    id: "lorry-vietnam-delta",
    mode: "lorry",
    minZoom: 1.75,
    speed: 0.03,
    phase: 0.61,
    containers: CONTAINER_COLORS[0],
    waypoints: [
      [105.8, 21.0],
      [108.2, 16.0],
      [106.7, 10.8],
    ],
  },
  {
    id: "lorry-ethiopia-djibouti",
    mode: "lorry",
    minZoom: 1.75,
    speed: 0.03,
    phase: 0.85,
    containers: CONTAINER_COLORS[3],
    waypoints: [
      [38.7, 7.0],
      [39.5, 9.0],
      [42.8, 11.5],
    ],
  },
];

// Capped 5 subtle ocean wave shimmer coordinates [lon, lat]
export const WAVE_SHIMMER_SPOTS = [
  [68.0, -8.0],
  [86.0, 11.0],
  [-28.0, 26.0],
  [14.0, -26.0],
  [134.0, 16.0],
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

// Build illustrative multi-leg vehicle sequence from an origin country to UK ("GB") or Singapore ("SG")
// Leg 1: Inland lorry/train to port -> Leg 2: Ocean ship (or overland train) -> Leg 3: Arrival lorry
export function buildMultiModeRouteLegs(origin, market = "GB") {
  const start = ORIGIN_COORDS[origin] || [90.35, 23.68];
  const isSG = market === "SG";
  const dest = isSG ? [103.82, 1.35] : [-1.4, 51.5];

  if (isSG) {
    switch (origin) {
      case "Bangladesh":
      case "India": {
        const port = [91.8, 22.3];
        return [
          { mode: "lorry", waypoints: [start, port] },
          { mode: "ship", waypoints: [port, [93.0, 14.0], [98.0, 5.5], dest] },
        ];
      }
      case "Vietnam": {
        const port = [107.0, 10.3];
        return [
          { mode: "lorry", waypoints: [start, port] },
          { mode: "ship", waypoints: [port, [106.0, 5.0], dest] },
        ];
      }
      case "China": {
        const port = [114.2, 22.3];
        return [
          { mode: "train", waypoints: [start, port] },
          { mode: "ship", waypoints: [port, [111.5, 12.0], [105.5, 3.5], dest] },
        ];
      }
      case "Ethiopia":
      case "Kenya": {
        const port = [43.1, 11.6];
        return [
          { mode: "lorry", waypoints: [start, port] },
          {
            mode: "ship",
            waypoints: [port, [54.0, 10.5], [78.0, 5.5], [96.5, 5.2], dest],
          },
        ];
      }
      default:
        return [
          { mode: "ship", waypoints: [start, [80.0, 6.0], [97.0, 5.0], dest] },
        ];
    }
  }

  // Destination: UK ("GB")
  const ukPort = [-1.4, 50.8]; // Southampton / Felixstowe
  switch (origin) {
    case "Bangladesh": {
      const port = [91.8, 22.3];
      return [
        { mode: "lorry", waypoints: [start, port] },
        {
          mode: "ship",
          waypoints: [
            port,
            [80.0, 6.0],
            [45.0, 12.5],
            [32.5, 30.5],
            [-5.5, 36.0],
            [-9.5, 43.5],
            ukPort,
          ],
        },
        { mode: "lorry", waypoints: [ukPort, dest] },
      ];
    }
    case "Vietnam": {
      const port = [107.0, 10.3];
      return [
        { mode: "lorry", waypoints: [start, port] },
        {
          mode: "ship",
          waypoints: [
            port,
            [103.8, 1.3],
            [80.0, 6.0],
            [45.0, 12.5],
            [32.5, 30.5],
            [-5.5, 36.0],
            [-9.5, 43.5],
            ukPort,
          ],
        },
        { mode: "lorry", waypoints: [ukPort, dest] },
      ];
    }
    case "China": {
      const hub = [114.2, 22.5];
      return [
        { mode: "train", waypoints: [start, hub] },
        {
          mode: "ship",
          waypoints: [
            hub,
            [104.0, 1.3],
            [80.0, 6.0],
            [45.0, 12.5],
            [32.5, 30.5],
            [-5.5, 36.0],
            [-9.5, 43.5],
            ukPort,
          ],
        },
        { mode: "lorry", waypoints: [ukPort, dest] },
      ];
    }
    case "Ethiopia":
    case "Kenya": {
      const port = [43.1, 11.6];
      return [
        { mode: "lorry", waypoints: [start, port] },
        {
          mode: "ship",
          waypoints: [
            port,
            [32.5, 30.5],
            [14.0, 36.5],
            [-5.5, 36.0],
            [-9.5, 43.5],
            ukPort,
          ],
        },
        { mode: "lorry", waypoints: [ukPort, dest] },
      ];
    }
    default:
      return [
        {
          mode: "ship",
          waypoints: [start, [32.5, 30.5], [-5.5, 36.0], ukPort],
        },
        { mode: "lorry", waypoints: [ukPort, dest] },
      ];
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