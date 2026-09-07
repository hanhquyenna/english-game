"use client";

import React, { useEffect, useRef } from "react";
import { iso, type MapTrack, type MapLandmark, type MapMate } from "@/lib/class-map";

interface VillageMinimapProps {
  tracks: MapTrack[];
  landmarks: MapLandmark[];
  mates: MapMate[];
  cam: { x: number; y: number };
  className?: string;
}

export function VillageMinimap({
  tracks,
  landmarks,
  mates,
  cam,
  className = "",
}: VillageMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#b9c69a";
    ctx.fillRect(0, 0, w, h);

    const allPoints: { x: number; y: number }[] = [];
    tracks.forEach((t) =>
      t.nodes.forEach((n) => allPoints.push(iso(n.grid.x, n.grid.y)))
    );
    landmarks.forEach((lm) => allPoints.push(iso(lm.grid.x, lm.grid.y)));

    const x0 = Math.min(...allPoints.map((p) => p.x)) - 90;
    const x1 = Math.max(...allPoints.map((p) => p.x)) + 90;
    const y0 = Math.min(...allPoints.map((p) => p.y)) - 90;
    const y1 = Math.max(...allPoints.map((p) => p.y)) + 90;

    const k = Math.min(w / (x1 - x0), h / (y1 - y0));
    const P = (wx: number, wy: number) => ({
      x: (wx - x0) * k + (w - (x1 - x0) * k) / 2,
      y: (wy - y0) * k + (h - (y1 - y0) * k) / 2,
    });

    // Draw tracks paths
    tracks.forEach((t) => {
      ctx.strokeStyle = t.kind === "learn" ? "#d9c39a" : "#b9a98d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      t.nodes.forEach((n, i) => {
        const p = P(iso(n.grid.x, n.grid.y).x, iso(n.grid.x, n.grid.y).y);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });

    // Draw track nodes
    tracks.forEach((t) => {
      t.nodes.forEach((n) => {
        const p = P(iso(n.grid.x, n.grid.y).x, iso(n.grid.x, n.grid.y).y);
        ctx.fillStyle =
          n.status === "done"
            ? "#d9a441"
            : n.status === "active"
            ? "#c75b39"
            : "#9d9583";
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.isBoss || n.isArenaFinal ? 4.5 : 3, 0, 7);
        ctx.fill();
        ctx.strokeStyle = "#2c231c";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    // Draw landmarks
    landmarks.forEach((lm) => {
      const p = P(iso(lm.grid.x, lm.grid.y).x, iso(lm.grid.x, lm.grid.y).y);
      ctx.fillStyle = "#8e9c77";
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.strokeStyle = "#2c231c";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 3, p.y - 3, 6, 6);
    });

    // Viewport camera indicator
    const camP = P(cam.x, cam.y);
    ctx.strokeStyle = "#c75b39";
    ctx.lineWidth = 2;
    ctx.strokeRect(camP.x - 16, camP.y - 12, 32, 24);
  }, [tracks, landmarks, mates, cam.x, cam.y]);

  return (
    <div
      id="mini"
      className={`hud tile p-1.5 bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hidden md:block ${className}`}
    >
      <canvas
        ref={canvasRef}
        width={128}
        height={74}
        className="block w-full h-[74px] border border-st-fg rounded-xs"
      />
      <div className="text-[8px] font-bold tracking-wider uppercase text-st-muted-fg text-center mt-1">
        Bản đồ làng Beeblast
      </div>
    </div>
  );
}
