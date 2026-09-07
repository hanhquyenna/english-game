"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { vnoise, h2 } from "@/lib/map-noise";
import {
  iso,
  TW,
  TH,
  VILLAGE_SQUARE,
  WORLD_BOUNDS,
  buildWorldSets,
  type MapTrack,
  type MapLandmark,
  type MapNode,
  type TrackKind,
  type BuildingStyle,
} from "@/lib/class-map";

export { iso };

interface VillageCanvasProps {
  tracks: MapTrack[];
  landmarks: MapLandmark[];
  cam: { x: number; y: number };
  zoom: number;
  onSelectNode: (track: TrackKind, nodeIndex: number) => void;
  onSelectLandmark: (id: string) => void;
  onPan?: (dx: number, dy: number) => void;
  onZoomChange?: (newZoom: number) => void;
  className?: string;
}

const FS =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Liberation Sans", "DejaVu Sans", sans-serif';
const FD = 'Georgia, "Iowan Old Style", "DejaVu Serif", serif';

interface Palette {
  bg: string;
  card: string;
  ink: string;
  pri: string;
  acc: string;
  sec: string;
  mut: string;
  mutfg: string;
  peach: string;
  dest: string;
  g1: string;
  g2: string;
  g3: string;
  p1: string;
  p2: string;
  w1: string;
  w2: string;
  t1: string;
  t2: string;
  t3: string;
  stone: string;
}

const DEFAULT_PALETTE: Palette = {
  bg: "#efe3cf",
  card: "#f4ecdd",
  ink: "#2c231c",
  pri: "#c75b39",
  acc: "#d9a441",
  sec: "#8e9c77",
  mut: "#e3d4ba",
  mutfg: "#7c5a3a",
  peach: "#f4d9c8",
  dest: "#a94631",
  g1: "#a1b07e",
  g2: "#96a675",
  g3: "#8a9a6b",
  p1: "#d9c39a",
  p2: "#c7b59a",
  w1: "#88aeb0",
  w2: "#6f989c",
  t1: "#87a26c",
  t2: "#6c8859",
  t3: "#55704a",
  stone: "#b9a98d",
};

export function VillageCanvas({
  tracks,
  landmarks,
  cam,
  zoom,
  onSelectNode,
  onSelectLandmark,
  onPan,
  onZoomChange,
  className = "",
}: VillageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const terrKeyRef = useRef<string>("");
  const lastCachedCamRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const paletteRef = useRef<Palette>(DEFAULT_PALETTE);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
    moved: number;
  } | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const globalTimeRef = useRef<number>(0);

  // Read CSS tokens once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const css = getComputedStyle(document.documentElement);
    const tok = (n: string, def: string) => css.getPropertyValue(n).trim() || def;
    paletteRef.current = {
      bg: tok("--st-bg", DEFAULT_PALETTE.bg),
      card: tok("--st-card", DEFAULT_PALETTE.card),
      ink: tok("--st-fg", DEFAULT_PALETTE.ink),
      pri: tok("--st-primary", DEFAULT_PALETTE.pri),
      acc: tok("--st-accent", DEFAULT_PALETTE.acc),
      sec: tok("--st-secondary", DEFAULT_PALETTE.sec),
      mut: tok("--st-muted", DEFAULT_PALETTE.mut),
      mutfg: tok("--st-muted-fg", DEFAULT_PALETTE.mutfg),
      peach: tok("--st-peach", DEFAULT_PALETTE.peach),
      dest: tok("--st-destructive", DEFAULT_PALETTE.dest),
      g1: tok("--grass-1", DEFAULT_PALETTE.g1),
      g2: tok("--grass-2", DEFAULT_PALETTE.g2),
      g3: tok("--grass-3", DEFAULT_PALETTE.g3),
      p1: tok("--path-1", DEFAULT_PALETTE.p1),
      p2: tok("--path-2", DEFAULT_PALETTE.p2),
      w1: tok("--water-1", DEFAULT_PALETTE.w1),
      w2: tok("--water-2", DEFAULT_PALETTE.w2),
      t1: tok("--tree-1", DEFAULT_PALETTE.t1),
      t2: tok("--tree-2", DEFAULT_PALETTE.t2),
      t3: tok("--tree-3", DEFAULT_PALETTE.t3),
      stone: tok("--stone", DEFAULT_PALETTE.stone),
    };
  }, []);

  const worldSets = useRef<{
    path: Set<string>;
    water: Set<string>;
    shore: Set<string>;
    sand: Set<string>;
  }>({
    path: new Set(),
    water: new Set(),
    shore: new Set(),
    sand: new Set(),
  });

  useEffect(() => {
    worldSets.current = buildWorldSets(tracks, landmarks);
    terrKeyRef.current = "";
  }, [tracks, landmarks]);

  const treeAt = useCallback(
    (gx: number, gy: number) => {
      const k = `${gx},${gy}`;
      const { path, water, shore, sand } = worldSets.current;
      if (path.has(k) || water.has(k) || shore.has(k) || sand.has(k)) return null;

      // Keep clear of all track stops
      for (const track of tracks) {
        for (const st of track.nodes) {
          if (Math.abs(st.grid.x - gx) < 3 && Math.abs(st.grid.y - gy) < 3) return null;
        }
      }
      // Keep clear of square and landmarks
      if (Math.abs(VILLAGE_SQUARE.x - gx) < 4 && Math.abs(VILLAGE_SQUARE.y - gy) < 4) return null;
      for (const lm of landmarks) {
        if (Math.abs(lm.grid.x - gx) < 3 && Math.abs(lm.grid.y - gy) < 3) return null;
      }

      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (path.has(`${gx + dx},${gy + dy}`)) return null;
        }
      }

      const d = h2(gx * 5.11, gy * 9.37);
      const dens = 0.65 + vnoise(gx * 0.2, gy * 0.2) * 0.28;
      if (d < dens) return null;

      const isNorthMountain = gy < 14;
      const isEastBeach = gx > 40;

      return {
        x: gx,
        y: gy,
        s: 0.8 + h2(gx * 2.7, gy * 4.1) * 0.45,
        t: isNorthMountain ? 0.2 : isEastBeach ? 0.95 : h2(gx * 7.3, gy * 1.9),
      };
    },
    [tracks, landmarks]
  );

  const drawDiamond = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x - w / 2, y);
    ctx.closePath();
  };

  const drawGroundTile = (
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    C: Palette
  ) => {
    const k = `${gx},${gy}`;
    const p = iso(gx, gy);
    const { path, water, shore, sand } = worldSets.current;

    if (water.has(k)) return;

    let top = "";
    let side = "";

    if (sand.has(k)) {
      top = "#e8d3a7";
      side = "#cca874";
    } else if (path.has(k)) {
      const isArenaArea = gy > 28;
      if (isArenaArea) {
        top = C.stone;
        side = "#9e8f74";
      } else {
        const n = vnoise(gx * 1.4, gy * 1.4);
        top = n > 0.55 ? C.p1 : "#d0b992";
        side = "#b09a76";
      }
    } else {
      const n = vnoise(gx * 0.3, gy * 0.3) * 0.7 + vnoise(gx * 0.9, gy * 0.9) * 0.3;
      top = n > 0.6 ? C.g1 : n > 0.4 ? C.g2 : C.g3;
      side = n > 0.6 ? "#7c8a60" : n > 0.4 ? "#748158" : "#6b7851";
    }

    drawDiamond(ctx, p.x, p.y, TW, TH);
    ctx.fillStyle = top;
    ctx.fill();

    if (side) {
      ctx.beginPath();
      ctx.moveTo(p.x - TW / 2, p.y);
      ctx.lineTo(p.x, p.y + TH / 2);
      ctx.lineTo(p.x + TW / 2, p.y);
      ctx.lineTo(p.x + TW / 2, p.y + 5);
      ctx.lineTo(p.x, p.y + TH / 2 + 5);
      ctx.lineTo(p.x - TW / 2, p.y + 5);
      ctx.closePath();
      ctx.fillStyle = side;
      ctx.fill();
    }

    if (shore.has(k)) {
      drawDiamond(ctx, p.x, p.y, TW, TH);
      ctx.fillStyle = "rgba(217,195,154,.55)";
      ctx.fill();
    }

    // Flower details
    if (side && !path.has(k) && !sand.has(k)) {
      const d = h2(gx * 3.3, gy * 7.7);
      if (d > 0.92) {
        ctx.fillStyle = d > 0.96 ? "#f4d9c8" : "#d9a441";
        ctx.fillRect(p.x - 1, p.y - 2, 2, 2);
        ctx.fillRect(p.x + 6, p.y + 2, 2, 2);
      }
    }
  };

  const drawPondBase = (ctx: CanvasRenderingContext2D, C: Palette) => {
    const { water } = worldSets.current;
    if (!water.size) return;

    ctx.save();
    ctx.beginPath();
    water.forEach((k) => {
      const [a, b] = k.split(",").map(Number);
      const p = iso(a, b);
      ctx.moveTo(p.x, p.y - TH / 2);
      ctx.lineTo(p.x + TW / 2, p.y);
      ctx.lineTo(p.x, p.y + TH / 2);
      ctx.lineTo(p.x - TW / 2, p.y);
      ctx.closePath();
    });
    ctx.fillStyle = C.w2;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(44,35,28,.30)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    water.forEach((k) => {
      const [a, b] = k.split(",").map(Number);
      const p = iso(a, b);
      const T = [p.x, p.y - TH / 2];
      const R = [p.x + TW / 2, p.y];
      const B = [p.x, p.y + TH / 2];
      const L = [p.x - TW / 2, p.y];
      const edge = (m: number[], n: number[]) => {
        ctx.moveTo(m[0], m[1]);
        ctx.lineTo(n[0], n[1]);
      };
      if (!water.has(`${a - 1},${b}`)) edge(T, L);
      if (!water.has(`${a},${b - 1}`)) edge(T, R);
      if (!water.has(`${a + 1},${b}`)) edge(R, B);
      if (!water.has(`${a},${b + 1}`)) edge(L, B);
    });
    ctx.stroke();
  };

  const drawPondRipples = (ctx: CanvasRenderingContext2D, t: number, C: Palette) => {
    const { water } = worldSets.current;
    if (!water.size) return;

    ctx.save();
    ctx.beginPath();
    let minx = 1e9,
      maxx = -1e9,
      miny = 1e9,
      maxy = -1e9;
    water.forEach((k) => {
      const [a, b] = k.split(",").map(Number);
      const p = iso(a, b);
      ctx.moveTo(p.x, p.y - TH / 2);
      ctx.lineTo(p.x + TW / 2, p.y);
      ctx.lineTo(p.x, p.y + TH / 2);
      ctx.lineTo(p.x - TW / 2, p.y);
      ctx.closePath();
      minx = Math.min(minx, p.x - TW / 2);
      maxx = Math.max(maxx, p.x + TW / 2);
      miny = Math.min(miny, p.y - TH / 2);
      maxy = Math.max(maxy, p.y + TH / 2);
    });
    ctx.clip();
    ctx.fillStyle = C.w1;
    for (let y = miny; y < maxy; y += 26) {
      const off = Math.sin(y * 0.05 + t * 0.9) * 14;
      ctx.fillRect(minx + off, y, maxx - minx, 13);
    }
    ctx.fillStyle = "rgba(255,255,255,.24)";
    for (let y = miny + 9; y < maxy; y += 26) {
      const off = Math.sin(y * 0.08 - t * 0.7) * 20;
      ctx.fillRect(minx + 34 + off, y, (maxx - minx) * 0.3, 2);
      ctx.fillRect(minx + 34 + off + (maxx - minx) * 0.42, y + 7, (maxx - minx) * 0.18, 2);
    }
    ctx.restore();
  };

  const drawTree = (
    ctx: CanvasRenderingContext2D,
    o: { x: number; y: number; s: number; t: number },
    C: Palette
  ) => {
    const p = iso(o.x, o.y);
    const s = o.s;
    ctx.fillStyle = "rgba(44,35,28,.16)";
    drawDiamond(ctx, p.x, p.y + 2, 22 * s, 11 * s);
    ctx.fill();

    if (o.t < 0.45) {
      // Pine tree
      const h = 34 * s;
      ctx.fillStyle = "#7a5a3c";
      ctx.fillRect(p.x - 2 * s, p.y - h * 0.34, 4 * s, h * 0.34);
      [
        [0, 1, C.t1],
        [-0.24, 0.76, C.t2],
        [-0.48, 0.5, C.t3],
      ].forEach(([dy, w, col]) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - h - (dy as number) * h * 0.5);
        ctx.lineTo(p.x + 14 * s * (w as number), p.y - h * 0.34 + (dy as number) * h * 0.5);
        ctx.lineTo(p.x - 14 * s * (w as number), p.y - h * 0.34 + (dy as number) * h * 0.5);
        ctx.closePath();
        ctx.fillStyle = col as string;
        ctx.fill();
      });
    } else if (o.t < 0.85) {
      // Broad oak tree
      const h = 28 * s;
      ctx.fillStyle = "#7a5a3c";
      ctx.fillRect(p.x - 2.2 * s, p.y - h * 0.42, 4.4 * s, h * 0.42);
      ctx.fillStyle = C.t2;
      ctx.beginPath();
      ctx.arc(p.x, p.y - h, 12 * s, 0, 7);
      ctx.fill();
      ctx.fillStyle = C.t1;
      ctx.beginPath();
      ctx.arc(p.x - 4 * s, p.y - h - 4 * s, 8 * s, 0, 7);
      ctx.fill();
      ctx.fillStyle = C.t3;
      ctx.beginPath();
      ctx.arc(p.x + 6 * s, p.y - h + 3 * s, 7 * s, 0, 7);
      ctx.fill();
    } else {
      // Coastal Palm / Rock
      ctx.fillStyle = "#9a7d55";
      ctx.fillRect(p.x - 1.5 * s, p.y - 24 * s, 3 * s, 24 * s);
      ctx.fillStyle = C.t1;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 24 * s, 10 * s, 0, 7);
      ctx.fill();
    }
  };

  // Unique Thematic Architecture
  const drawBuilding = (
    ctx: CanvasRenderingContext2D,
    node: MapNode,
    t: number,
    C: Palette
  ) => {
    const p = iso(node.grid.x, node.grid.y);
    const style = node.buildingStyle || "cottage";

    if (node.isBoss || style === "boss_keep") {
      drawBossKeep(ctx, p, node.status, C);
      return;
    }
    if (node.isArenaFinal || style === "colosseum") {
      drawArenaColosseum(ctx, p, node.status, C);
      return;
    }

    const locked = node.status === "locked";
    const wallCol = locked ? C.stone : node.track === "arena" ? "#c7b59a" : C.card;
    const roofCol = locked ? "#8d8069" : node.track === "arena" ? C.sec : C.pri;

    // Shadow
    ctx.fillStyle = "rgba(44,35,28,.2)";
    drawDiamond(ctx, p.x, p.y + 3, 42, 21);
    ctx.fill();

    if (style === "wizard_tower") {
      // Tall circular wizard spire
      const h = 46;
      ctx.fillStyle = wallCol;
      ctx.fillRect(p.x - 12, p.y - h, 24, h);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - 12, p.y - h, 24, h);

      // Conical crystal roof
      ctx.fillStyle = locked ? "#6c6250" : "#5d78a8";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h - 22);
      ctx.lineTo(p.x + 15, p.y - h);
      ctx.lineTo(p.x - 15, p.y - h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Magical glowing orb
      if (!locked) {
        ctx.fillStyle = "#88d4f0";
        ctx.beginPath();
        ctx.arc(p.x, p.y - h - 24 + Math.sin(t * 3) * 2, 4, 0, 7);
        ctx.fill();
      }
    } else if (style === "windmill") {
      // Windmill tower
      const h = 36;
      ctx.fillStyle = wallCol;
      ctx.beginPath();
      ctx.moveTo(p.x - 14, p.y);
      ctx.lineTo(p.x - 9, p.y - h);
      ctx.lineTo(p.x + 9, p.y - h);
      ctx.lineTo(p.x + 14, p.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating sails
      const angle = t * 1.5;
      ctx.save();
      ctx.translate(p.x, p.y - h + 8);
      ctx.rotate(angle);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.8;
      for (let b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = "rgba(244,236,221,0.9)";
        ctx.fillRect(2, -3, 20, 6);
        ctx.strokeRect(2, -3, 20, 6);
      }
      ctx.restore();
    } else if (style === "observatory") {
      // Observatory with dome
      const w = 36,
        h = 24;
      ctx.fillStyle = wallCol;
      ctx.fillRect(p.x - w / 2, p.y - h, w, h);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - w / 2, p.y - h, w, h);

      ctx.fillStyle = locked ? "#6c6250" : C.acc;
      ctx.beginPath();
      ctx.arc(p.x, p.y - h, 14, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Telescope
      ctx.strokeStyle = "#8a5f3c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h - 4);
      ctx.lineTo(p.x + 14, p.y - h - 18);
      ctx.stroke();
    } else {
      // Cozy Cottage / Lodge
      const w = 34,
        h = 26;
      ctx.fillStyle = wallCol;
      ctx.beginPath();
      ctx.moveTo(p.x - w / 2, p.y);
      ctx.lineTo(p.x, p.y + w / 4);
      ctx.lineTo(p.x, p.y + w / 4 - h);
      ctx.lineTo(p.x - w / 2, p.y - h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = locked ? "#7d7159" : "#ddd0b8";
      ctx.beginPath();
      ctx.moveTo(p.x + w / 2, p.y);
      ctx.lineTo(p.x, p.y + w / 4);
      ctx.lineTo(p.x, p.y + w / 4 - h);
      ctx.lineTo(p.x + w / 2, p.y - h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = roofCol;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - h - 12);
      ctx.lineTo(p.x + w / 2 + 4, p.y - h + 2);
      ctx.lineTo(p.x + w / 4, p.y - h + 2);
      ctx.lineTo(p.x - w / 2 - 4, p.y - h + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Chimney + Animated smoke
      if (!locked) {
        ctx.fillStyle = "#8a5f3c";
        ctx.fillRect(p.x - w / 3, p.y - h - 14, 5, 8);
        ctx.fillStyle = "rgba(240,230,210,0.5)";
        for (let puff = 0; puff < 3; puff++) {
          const py = (t * 12 + puff * 8) % 24;
          const px = Math.sin(t * 2 + puff) * 4;
          ctx.beginPath();
          ctx.arc(p.x - w / 3 + 2 + px, p.y - h - 16 - py, 3 + py * 0.15, 0, 7);
          ctx.fill();
        }
      }
    }
  };

  const drawBossKeep = (
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number },
    status: string,
    C: Palette
  ) => {
    const w = 56;
    const h = 54;
    const locked = status === "locked";
    const wall = locked ? "#9a8f78" : C.stone;
    const wallD = locked ? "#7b7260" : "#9e8f74";
    const roof = locked ? "#7d7159" : C.dest;

    ctx.fillStyle = "rgba(44,35,28,.24)";
    drawDiamond(ctx, p.x, p.y + 4, w + 24, (w + 24) / 2);
    ctx.fill();

    // Towers
    [-1, 1].forEach((d) => {
      const tx = p.x + d * 32;
      const ty = p.y - 6;
      const tw = 18;
      const th = h + 14;
      ctx.fillStyle = wall;
      ctx.fillRect(tx - tw / 2, ty - th, tw / 2, th);
      ctx.fillStyle = wallD;
      ctx.fillRect(tx, ty - th, tw / 2, th);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx - tw / 2, ty - th, tw, th);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = wall;
        ctx.fillRect(tx - tw / 2 + i * 6, ty - th - 5, 4, 5);
        ctx.strokeRect(tx - tw / 2 + i * 6, ty - th - 5, 4, 5);
      }
    });

    // Castle keep body
    ctx.fillStyle = wall;
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, p.y);
    ctx.lineTo(p.x, p.y + w / 4);
    ctx.lineTo(p.x, p.y + w / 4 - h);
    ctx.lineTo(p.x - w / 2, p.y - h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = wallD;
    ctx.beginPath();
    ctx.moveTo(p.x + w / 2, p.y);
    ctx.lineTo(p.x, p.y + w / 4);
    ctx.lineTo(p.x, p.y + w / 4 - h);
    ctx.lineTo(p.x + w / 2, p.y - h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Grand Roof
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - h - 26);
    ctx.lineTo(p.x + w / 2 + 6, p.y - h + 2);
    ctx.lineTo(p.x + w / 4, p.y - h + 2);
    ctx.lineTo(p.x - w / 2 - 6, p.y - h + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Banners
    [-1, 1].forEach((d) => {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + d * 14, p.y - h - 14);
      ctx.lineTo(p.x + d * 14, p.y - h - 40);
      ctx.stroke();

      ctx.fillStyle = locked ? "#8d8069" : C.dest;
      ctx.beginPath();
      ctx.moveTo(p.x + d * 14, p.y - h - 40);
      ctx.lineTo(p.x + d * 14 + d * 14, p.y - h - 35);
      ctx.lineTo(p.x + d * 14, p.y - h - 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawArenaColosseum = (
    ctx: CanvasRenderingContext2D,
    p: { x: number; y: number },
    status: string,
    C: Palette
  ) => {
    const w = 68;
    const h = 36;
    const locked = status === "locked";
    const stone = locked ? "#9a8f78" : C.stone;
    const sand = locked ? "#7d7159" : C.acc;

    ctx.fillStyle = "rgba(44,35,28,.25)";
    drawDiamond(ctx, p.x, p.y + 4, w + 24, (w + 24) / 2);
    ctx.fill();

    // Colosseum tiers
    ctx.fillStyle = stone;
    drawDiamond(ctx, p.x, p.y - h, w, w / 2);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Colosseum side
    ctx.fillStyle = "#8a7b62";
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, p.y - h);
    ctx.lineTo(p.x, p.y - h + w / 4);
    ctx.lineTo(p.x + w / 2, p.y - h);
    ctx.lineTo(p.x + w / 2, p.y);
    ctx.lineTo(p.x, p.y + w / 4);
    ctx.lineTo(p.x - w / 2, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arena sand floor
    ctx.fillStyle = sand;
    drawDiamond(ctx, p.x, p.y - h + 2, w * 0.68, (w * 0.68) / 2);
    ctx.fill();
    ctx.stroke();

    // Championship Banners
    [-1, 1].forEach((d) => {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + d * 24, p.y - h);
      ctx.lineTo(p.x + d * 24, p.y - h - 24);
      ctx.stroke();

      ctx.fillStyle = locked ? "#8d8069" : C.sec;
      ctx.beginPath();
      ctx.moveTo(p.x + d * 24, p.y - h - 24);
      ctx.lineTo(p.x + d * 24 + d * 12, p.y - h - 19);
      ctx.lineTo(p.x + d * 24, p.y - h - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawLandmarkBuilding = (
    ctx: CanvasRenderingContext2D,
    lm: MapLandmark,
    t: number,
    C: Palette
  ) => {
    const p = iso(lm.grid.x, lm.grid.y);

    if (lm.id === "fountain") {
      // Central Village Fountain
      ctx.fillStyle = C.stone;
      drawDiamond(ctx, p.x, p.y, 44, 22);
      ctx.fill();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = C.w1;
      drawDiamond(ctx, p.x, p.y - 2, 34, 17);
      ctx.fill();

      // Sparkling water jet
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 12 + Math.sin(t * 4) * 2, 4, 0, 7);
      ctx.fill();
      return;
    }

    const w = 38;
    const h = 32;
    ctx.fillStyle = "rgba(44,35,28,.2)";
    drawDiamond(ctx, p.x, p.y + 3, w + 10, (w + 10) / 2);
    ctx.fill();

    const roofColor = lm.id === "vault" ? C.acc : lm.id === "shop" ? C.pri : C.sec;

    // Body
    ctx.fillStyle = C.card;
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2, p.y);
    ctx.lineTo(p.x, p.y + w / 4);
    ctx.lineTo(p.x, p.y + w / 4 - h);
    ctx.lineTo(p.x - w / 2, p.y - h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ddd0b8";
    ctx.beginPath();
    ctx.moveTo(p.x + w / 2, p.y);
    ctx.lineTo(p.x, p.y + w / 4);
    ctx.lineTo(p.x, p.y + w / 4 - h);
    ctx.lineTo(p.x + w / 2, p.y - h);
    ctx.closePath();
    ctx.fill();

    // Roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - h - 16);
    ctx.lineTo(p.x + w / 2 + 5, p.y - h + 2);
    ctx.lineTo(p.x + w / 4, p.y - h + 2);
    ctx.lineTo(p.x - w / 2 - 5, p.y - h + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = C.ink;
    ctx.font = `bold 9px ${FS}`;
    ctx.textAlign = "center";
    ctx.fillText(lm.label, p.x, p.y - h - 20);
  };

  const drawSignpost = (ctx: CanvasRenderingContext2D, C: Palette) => {
    const p = iso(VILLAGE_SQUARE.x + 1, VILLAGE_SQUARE.y + 1);
    ctx.fillStyle = "#7a5a3c";
    ctx.fillRect(p.x - 2, p.y - 28, 4, 28);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p.x - 2, p.y - 28, 4, 28);

    // North branch (Học)
    ctx.fillStyle = C.pri;
    ctx.fillRect(p.x - 24, p.y - 28, 22, 10);
    ctx.strokeRect(p.x - 24, p.y - 28, 22, 10);
    ctx.fillStyle = C.card;
    ctx.font = `bold 8px ${FS}`;
    ctx.textAlign = "center";
    ctx.fillText("HỌC ↑", p.x - 13, p.y - 20);

    // South branch (Đấu)
    ctx.fillStyle = C.sec;
    ctx.fillRect(p.x + 2, p.y - 20, 22, 10);
    ctx.strokeRect(p.x + 2, p.y - 20, 22, 10);
    ctx.fillStyle = C.card;
    ctx.fillText("ĐẤU ↓", p.x + 13, p.y - 12);
  };

  const drawMarker = (
    ctx: CanvasRenderingContext2D,
    node: MapNode,
    t: number,
    C: Palette
  ) => {
    const p = iso(node.grid.x, node.grid.y);
    const boss = node.isBoss || node.isArenaFinal;
    const status = node.status;
    const lift = boss ? 78 : 54;
    const bob = status === "active" ? Math.sin(t * 2.4) * 3 : 0;
    const y = p.y - lift + bob;
    const r = boss ? 17 : 13;

    ctx.save();
    if (status === "active") {
      const g = (Math.sin(t * 2.4) + 1) / 2;
      ctx.beginPath();
      ctx.arc(p.x, y, r + 5 + g * 5, 0, 7);
      ctx.strokeStyle = `rgba(199,91,57,${0.5 - g * 0.36})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(p.x, y, r, 0, 7);
    ctx.fillStyle = status === "done" ? C.acc : status === "active" ? C.pri : C.mut;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();

    ctx.fillStyle = status === "locked" ? C.mutfg : C.card;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (status === "done") {
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.ink;
      ctx.beginPath();
      ctx.moveTo(p.x - 5, y);
      ctx.lineTo(p.x - 1, y + 4);
      ctx.lineTo(p.x + 6, y - 5);
      ctx.stroke();
    } else if (status === "locked") {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = C.mutfg;
      ctx.strokeRect(p.x - 4, y - 1, 8, 7);
      ctx.beginPath();
      ctx.arc(p.x, y - 1, 3.2, Math.PI, 0);
      ctx.stroke();
    } else {
      ctx.font = `bold ${boss ? 15 : 13}px ${FD}`;
      ctx.fillText(node.isBoss ? "★" : node.isArenaFinal ? "⚔" : String(node.index + 1), p.x, y + 1);
    }

    ctx.strokeStyle = "rgba(44,35,28,.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(p.x, y + r);
    ctx.lineTo(p.x, p.y - 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const getVisibleRange = (
    w: number,
    h: number,
    camX: number,
    camY: number,
    z: number,
    bufferPx = 160
  ) => {
    const inv = (x: number, y: number) => ({
      gx: (y / (TH / 2) + x / (TW / 2)) / 2,
      gy: (y / (TH / 2) - x / (TW / 2)) / 2,
    });
    const hw = (w / 2 + bufferPx) / z;
    const hh = (h / 2 + bufferPx) / z;
    const cs = [
      [-hw, -hh],
      [hw, -hh],
      [-hw, hh],
      [hw, hh],
    ].map(([dx, dy]) => inv(camX + dx, camY + dy));

    return {
      gx0: Math.floor(Math.min(...cs.map((c) => c.gx))) - 3,
      gx1: Math.ceil(Math.max(...cs.map((c) => c.gx))) + 3,
      gy0: Math.floor(Math.min(...cs.map((c) => c.gy))) - 3,
      gy1: Math.ceil(Math.max(...cs.map((c) => c.gy))) + 4,
    };
  };

  const buildTerrainOffscreen = (
    w: number,
    h: number,
    dpr: number,
    camX: number,
    camY: number,
    z: number,
    t: number,
    C: Palette
  ) => {
    const camDist = Math.hypot(
      camX - lastCachedCamRef.current.x,
      camY - lastCachedCamRef.current.y
    );
    const key = [
      Math.round(lastCachedCamRef.current.x),
      Math.round(lastCachedCamRef.current.y),
      z.toFixed(3),
      w,
      h,
      dpr,
    ].join("|");

    if (key === terrKeyRef.current && camDist < 24 && offscreenRef.current) {
      return offscreenRef.current;
    }

    lastCachedCamRef.current = { x: camX, y: camY };
    terrKeyRef.current = [Math.round(camX), Math.round(camY), z.toFixed(3), w, h, dpr].join("|");

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas");
    }
    const off = offscreenRef.current;
    const buffer = 160;
    off.width = Math.max(1, Math.floor((w + buffer * 2) * dpr));
    off.height = Math.max(1, Math.floor((h + buffer * 2) * dpr));

    const g = off.getContext("2d");
    if (!g) return off;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = false;

    const wash = g.createLinearGradient(0, 0, 0, h + buffer * 2);
    wash.addColorStop(0, "#efe3cf");
    wash.addColorStop(1, "#dcd0b6");
    g.fillStyle = wash;
    g.fillRect(0, 0, w + buffer * 2, h + buffer * 2);

    g.save();
    g.translate(Math.round(w / 2 + buffer), Math.round(h / 2 + buffer));
    g.scale(z, z);
    g.translate(-Math.round(camX), -Math.round(camY));

    const range = getVisibleRange(w, h, camX, camY, z, buffer);
    for (let gx = range.gx0; gx <= range.gx1; gx++) {
      for (let gy = range.gy0; gy <= range.gy1; gy++) {
        drawGroundTile(g, gx, gy, C);
      }
    }
    drawPondBase(g, C);

    const props: { d: number; f: () => void }[] = [];
    for (let gx = range.gx0; gx <= range.gx1; gx++) {
      for (let gy = range.gy0; gy <= range.gy1; gy++) {
        const o = treeAt(gx, gy);
        if (o) props.push({ d: gx + gy, f: () => drawTree(g, o, C) });
      }
    }

    tracks.forEach((track) =>
      track.nodes.forEach((st) => {
        props.push({
          d: st.grid.x + st.grid.y - 0.5,
          f: () => drawBuilding(g, st, t, C),
        });
      })
    );

    landmarks.forEach((lm) => {
      props.push({
        d: lm.grid.x + lm.grid.y - 0.5,
        f: () => drawLandmarkBuilding(g, lm, t, C),
      });
    });

    props.push({
      d: VILLAGE_SQUARE.x + VILLAGE_SQUARE.y - 0.2,
      f: () => drawSignpost(g, C),
    });

    props.sort((a, b) => a.d - b.d).forEach((pr) => pr.f());

    g.restore();
    return off;
  };

  // Main Render Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let startTime = performance.now();

    const render = (ts: number) => {
      const t = (ts - startTime) / 1000;
      globalTimeRef.current = t;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr)
      ) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        terrKeyRef.current = "";
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const C = paletteRef.current;
      const terr = buildTerrainOffscreen(w, h, dpr, cam.x, cam.y, zoom, t, C);
      const buffer = 160;
      const shiftX = (lastCachedCamRef.current.x - cam.x) * zoom;
      const shiftY = (lastCachedCamRef.current.y - cam.y) * zoom;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(
        terr,
        0,
        0,
        terr.width,
        terr.height,
        -buffer + shiftX,
        -buffer + shiftY,
        w + buffer * 2,
        h + buffer * 2
      );

      ctx.save();
      ctx.translate(Math.round(w / 2), Math.round(h / 2));
      ctx.scale(zoom, zoom);
      ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

      drawPondRipples(ctx, t, C);
      tracks.forEach((track) =>
        track.nodes.forEach((node) => drawMarker(ctx, node, t, C))
      );

      ctx.restore();

      // Soft vignette
      const vg = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        Math.min(w, h) * 0.28,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75
      );
      vg.addColorStop(0, "rgba(44,35,28,0)");
      vg.addColorStop(1, "rgba(44,35,28,.22)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [tracks, landmarks, cam.x, cam.y, zoom, treeAt]);

  // Touch / Wheel Event Handling with e.preventDefault() to eliminate scroll bug
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (onZoomChange) {
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        const newZ = Math.max(0.55, Math.min(1.85, zoom + delta));
        onZoomChange(newZ);
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, onZoomChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      camX: cam.x,
      camY: cam.y,
      moved: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.moved = Math.hypot(dx, dy);
    if (onPan && dragRef.current.moved > 4) {
      onPan(-dx / zoom, -dy / zoom);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current && dragRef.current.moved < 6) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const worldX = (screenX - w / 2) / zoom + cam.x;
        const worldY = (screenY - h / 2) / zoom + cam.y;

        // Check landmarks
        for (const lm of landmarks) {
          const p = iso(lm.grid.x, lm.grid.y);
          if (Math.hypot(worldX - p.x, worldY - (p.y - 14)) < 36) {
            onSelectLandmark(lm.id);
            dragRef.current = null;
            return;
          }
        }

        // Check track nodes
        for (const track of tracks) {
          for (let i = track.nodes.length - 1; i >= 0; i--) {
            const node = track.nodes[i];
            const p = iso(node.grid.x, node.grid.y);
            const lift = node.isBoss || node.isArenaFinal ? 78 : 54;
            if (Math.hypot(worldX - p.x, worldY - (p.y - lift)) < 28) {
              onSelectNode(track.kind, i);
              dragRef.current = null;
              return;
            }
            if (Math.hypot(worldX - p.x, worldY - (p.y - 14)) < 36) {
              onSelectNode(track.kind, i);
              dragRef.current = null;
              return;
            }
          }
        }
      }
    }
    dragRef.current = null;
  };

  return (
    <canvas
      id="map"
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`block w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
    />
  );
}
