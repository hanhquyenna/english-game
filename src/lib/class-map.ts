import type { Island } from "@/lib/islands";

export type TrackKind = "learn" | "arena";
export type MapNodeStatus = "done" | "active" | "locked";

export type BuildingStyle =
  | "cottage"
  | "wizard_tower"
  | "ranger_lodge"
  | "blacksmith"
  | "observatory"
  | "windmill"
  | "lighthouse"
  | "gatehouse"
  | "dojo"
  | "temple"
  | "boss_keep"
  | "colosseum";

export type MapNode = {
  index: number;
  track: TrackKind;
  topicId: string;
  level: number | null;
  isBoss: boolean;
  isArenaFinal: boolean;
  name: string;
  status: MapNodeStatus;
  grid: { x: number; y: number };
  buildingStyle?: BuildingStyle;
  lockedReason: string | null;
};

export type MapTrack = {
  kind: TrackKind;
  label: string;
  nodes: MapNode[];
};

export type MapLandmark = {
  id: "vault" | "shop" | "rank" | "farm" | "beach" | "fountain";
  label: string;
  grid: { x: number; y: number };
  href?: string;
  badge?: number;
};

export type MapMate = {
  studentId: string;
  name: string;
  track: TrackKind;
  nodeIndex: number;
  seed: string;
  overrides: Record<string, unknown>;
  items: { icon: string; slot: "hat" | "badge"; color?: string; label?: string }[];
  isMe: boolean;
};

export type VillageMapData = {
  className: string;
  tracks: MapTrack[];
  landmarks: MapLandmark[];
  mates: MapMate[];
  me: { track: TrackKind; nodeIndex: number };
  classUnlocked: number;
  totalNodes: number;
  arenaUnlocked: boolean;
  arenaLockedReason: string | null;
};

export type ClassMapData = VillageMapData;

export const VILLAGE_SQUARE = { x: 28, y: 28 };

export const DEFAULT_LANDMARKS: MapLandmark[] = [
  { id: "fountain", label: "Đài phun nước làng", grid: { x: 28, y: 28 } },
  { id: "vault", label: "Thư viện Từ vựng", grid: { x: 23, y: 28 }, href: "/student/:id/vault" },
  { id: "shop", label: "Tiệm Thời trang", grid: { x: 28, y: 23 }, href: "/student/:id/shop" },
  { id: "rank", label: "Tháp Bảng vàng", grid: { x: 33, y: 28 }, href: "/student/:id/rank" },
  { id: "farm", label: "Nông trại Cối xay", grid: { x: 16, y: 28 } },
  { id: "beach", label: "Bờ biển Hải đăng", grid: { x: 42, y: 28 } },
];

export const LEARN_GRID = [
  { x: 25, y: 24 }, // 1. Ranger Lodge
  { x: 21, y: 22 }, // 2. Herbalist Cottage
  { x: 16, y: 20 }, // 3. Windmill Bakery
  { x: 13, y: 15 }, // 4. Blacksmith Forge
  { x: 17, y: 10 }, // 5. Wizard Library
  { x: 24, y: 8 },  // 6. Astrologer Observatory
  { x: 32, y: 7 },  // 7. Stone Gatehouse
  { x: 38, y: 5 },  // 8. Royal Guard Tower
  { x: 44, y: 4 },  // 9. Boss Keep Castle
];

export const ARENA_GRID = [
  { x: 29, y: 30 }, // 1. Training Camp
  { x: 34, y: 31 }, // 2. Duelists Dojo
  { x: 39, y: 34 }, // 3. Coastal Fishery
  { x: 40, y: 40 }, // 4. Sailor Haven
  { x: 36, y: 45 }, // 5. Water Mill
  { x: 30, y: 48 }, // 6. Lotus Pavilion
  { x: 23, y: 49 }, // 7. Warrior Arena Gate
  { x: 17, y: 47 }, // 8. Champions Staging
  { x: 11, y: 44 }, // 9. Grand Arena Colosseum
];

export const LEARN_STYLES: BuildingStyle[] = [
  "ranger_lodge",
  "cottage",
  "windmill",
  "blacksmith",
  "wizard_tower",
  "observatory",
  "gatehouse",
  "temple",
  "boss_keep",
];

export const ARENA_STYLES: BuildingStyle[] = [
  "dojo",
  "cottage",
  "lighthouse",
  "ranger_lodge",
  "windmill",
  "temple",
  "gatehouse",
  "blacksmith",
  "colosseum",
];

export const TW = 56;
export const TH = 28;
export const GW = 56;
export const GH = 56;

export const iso = (gx: number, gy: number) => ({
  x: ((gx - gy) * TW) / 2,
  y: ((gx + gy) * TH) / 2,
});

export const WORLD_BOUNDS = {
  minX: -1450,
  maxX: 1450,
  minY: -100,
  maxY: 1750,
};

export function trackGrid(kind: TrackKind, count: number): { x: number; y: number }[] {
  const base = kind === "learn" ? LEARN_GRID : ARENA_GRID;
  if (count === base.length) {
    return base.map((g) => ({ ...g }));
  }
  if (count <= 0) return [];
  if (count === 1) return [{ x: base[0].x, y: base[0].y }];

  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const floatIdx = t * (base.length - 1);
    const baseIdx = Math.floor(floatIdx);
    const nextIdx = Math.min(base.length - 1, baseIdx + 1);
    const frac = floatIdx - baseIdx;
    const gx = Math.round(base[baseIdx].x + frac * (base[nextIdx].x - base[baseIdx].x));
    const gy = Math.round(base[baseIdx].y + frac * (base[nextIdx].y - base[baseIdx].y));
    result.push({ x: gx, y: gy });
  }
  return result;
}

export function nodeGrid(count: number): { x: number; y: number }[] {
  return trackGrid("learn", count);
}

export function toMapNodes(
  island: Island,
  kind: TrackKind = "learn",
  unitName: string = ""
): MapNode[] {
  const count = island.nodes.length;
  const grids = trackGrid(kind, count);
  const styles = kind === "learn" ? LEARN_STYLES : ARENA_STYLES;

  return island.nodes.map((node, i) => {
    const isLast = i === count - 1 || node.isExam;
    const isBoss = kind === "learn" && isLast;
    const isArenaFinal = kind === "arena" && isLast;

    let status: MapNodeStatus = node.status;
    if (!island.unlocked) {
      status = "locked";
    }

    let name = unitName || island.name;
    if (isBoss) name = "TRÙM CUỐI";
    else if (isArenaFinal) name = "ĐẤU TRƯỜNG";

    return {
      index: i,
      track: kind,
      topicId: island.topicId,
      level: node.level,
      isBoss,
      isArenaFinal,
      name,
      status,
      grid: grids[i] || { x: 0, y: 0 },
      buildingStyle: styles[i] || (isBoss ? "boss_keep" : isArenaFinal ? "colosseum" : "cottage"),
      lockedReason: island.lockedReason,
    };
  });
}

export function nodeIndexFor(percentComplete: number, totalNodes: number): number {
  if (totalNodes <= 0) return 0;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percentComplete) ? percentComplete : 0));
  if (clamped >= 100) return totalNodes - 1;
  return Math.min(totalNodes - 1, Math.max(0, Math.floor((clamped / 100) * totalNodes)));
}

export function fanOffsets(count: number): { dx: number; dy: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ dx: 0, dy: 0 }];

  const offsets: { dx: number; dy: number }[] = [];
  const perRing = 5;

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / perRing);
    const idx = i % perRing;
    const ringCount = Math.min(perRing, count - ring * perRing);

    const R = 38 + ring * 32;
    const startAngle = -Math.PI * 0.9 + (ring % 2 === 1 ? 0.3 : 0);
    const arcSpan = Math.PI * 0.85;
    const a =
      ringCount > 1
        ? startAngle + (idx / (ringCount - 1)) * arcSpan
        : startAngle + arcSpan / 2;

    const dx = Math.round(Math.cos(a) * R);
    const dy = Math.round(14 + Math.sin(a) * (R * 0.72) + ring * 6);

    offsets.push({ dx, dy });
  }

  return offsets;
}

/**
 * Builds contiguous path, water, shore and sand coordinate sets for the open world.
 */
export function buildWorldSets(
  tracks: MapTrack[],
  landmarks: MapLandmark[] = DEFAULT_LANDMARKS
): { path: Set<string>; water: Set<string>; shore: Set<string>; sand: Set<string> } {
  const path = new Set<string>();

  const addLine = (ax: number, ay: number, bx: number, by: number) => {
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) path.add(`${x},${ay}`);
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) path.add(`${bx},${y}`);
  };

  // 1. Village square area
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      path.add(`${VILLAGE_SQUARE.x + dx},${VILLAGE_SQUARE.y + dy}`);
    }
  }

  // 2. Tracks internal paths
  for (const track of tracks) {
    const nodes = track.nodes;
    for (let i = 0; i < nodes.length - 1; i++) {
      addLine(nodes[i].grid.x, nodes[i].grid.y, nodes[i + 1].grid.x, nodes[i + 1].grid.y);
    }
    nodes.forEach((n) => path.add(`${n.grid.x},${n.grid.y}`));
    if (nodes.length > 0) {
      addLine(VILLAGE_SQUARE.x, VILLAGE_SQUARE.y, nodes[0].grid.x, nodes[0].grid.y);
    }
  }

  // 3. Connect landmarks
  for (const lm of landmarks) {
    addLine(VILLAGE_SQUARE.x, VILLAGE_SQUARE.y, lm.grid.x, lm.grid.y);
    path.add(`${lm.grid.x},${lm.grid.y}`);
    [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([dx, dy]) => path.add(`${lm.grid.x + dx},${lm.grid.y + dy}`));
  }

  // 4. Widen paths (2-tile width)
  const initialPath = [...path];
  initialPath.forEach((k) => {
    const [a, b] = k.split(",").map(Number);
    path.add(`${a + 1},${b}`);
  });

  // 5. Clearings around all stops
  tracks.forEach((t) =>
    t.nodes.forEach((s) => {
      [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
      ].forEach(([dx, dy]) => path.add(`${s.grid.x + dx},${s.grid.y + dy}`));
    })
  );

  // 6. Water bodies (Southern Lotus Lake & Eastern Sea Coast)
  const water = new Set<string>();
  const sand = new Set<string>();

  // Southern Lotus Lake (centered ~ [22, 40])
  for (let x = 16; x < 28; x++) {
    for (let y = 34; y < 46; y++) {
      const d = Math.hypot(x - 22, y - 40);
      if (d < 4.8 && !path.has(`${x},${y}`)) {
        water.add(`${x},${y}`);
      }
    }
  }

  // Eastern Ocean Beach Coast (x >= 46)
  for (let x = 46; x < GW; x++) {
    for (let y = 0; y < GH; y++) {
      if (!path.has(`${x},${y}`)) {
        if (x >= 49) {
          water.add(`${x},${y}`);
        } else {
          sand.add(`${x},${y}`);
        }
      }
    }
  }

  // 7. Shore (adjacent to water, not water itself)
  const shore = new Set<string>();
  water.forEach((k) => {
    const [a, b] = k.split(",").map(Number);
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ].forEach(([dx, dy]) => {
      const n = `${a + dx},${b + dy}`;
      if (!water.has(n)) shore.add(n);
    });
  });

  return { path, water, shore, sand };
}
