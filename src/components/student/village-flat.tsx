"use client";

import React from "react";
import type { MapTrack, MapNode, TrackKind } from "@/lib/class-map";

interface VillageFlatProps {
  tracks: MapTrack[];
  onSelectNode: (track: TrackKind, index: number) => void;
  className?: string;
}

export function VillageFlat({
  tracks,
  onSelectNode,
  className = "",
}: VillageFlatProps) {
  return (
    <div
      className={`absolute inset-0 bg-st-bg overflow-y-auto p-6 flex flex-col items-center gap-8 ${className}`}
    >
      {tracks.map((track) => (
        <div
          key={track.kind}
          className="w-full max-w-4xl bg-st-card border-2 border-st-fg rounded-sm p-4 shadow-[3px_3px_0_0_var(--st-fg)]"
        >
          <div className="flex justify-between items-center mb-4 border-b-2 border-st-fg pb-2">
            <h2 className="text-sm font-black tracking-wide uppercase text-st-fg">
              {track.label}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-st-peach border border-st-fg rounded-xs text-st-fg">
              {track.nodes.filter((n) => n.status === "done").length} / {track.nodes.length} hoàn thành
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
            {track.nodes.map((node) => {
              const isBoss = node.isBoss || node.isArenaFinal;
              const isDone = node.status === "done";
              const isActive = node.status === "active";
              const isLocked = node.status === "locked";

              return (
                <div
                  key={`${track.kind}-${node.index}`}
                  onClick={() => onSelectNode(track.kind, node.index)}
                  className="group flex flex-col items-center cursor-pointer text-center"
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 border-st-fg flex items-center justify-center font-bold text-sm shadow-[2px_2px_0_0_var(--st-fg)] transition-transform group-hover:scale-105 group-active:translate-x-0.5 group-active:translate-y-0.5 ${
                      isDone
                        ? "bg-st-accent text-st-fg"
                        : isActive
                        ? "bg-st-primary text-st-primary-fg ring-2 ring-st-primary/50"
                        : "bg-st-muted text-st-muted-fg opacity-75 shadow-none"
                    }`}
                  >
                    {node.isBoss ? "★" : node.isArenaFinal ? "⚔" : node.index + 1}
                  </div>
                  <div className="mt-1.5 text-[10px] font-bold text-st-fg leading-tight truncate w-full">
                    {node.name}
                  </div>
                  <div className="text-[9px] text-st-muted-fg font-medium">
                    {isDone ? "Đã xong" : isActive ? "Đang mở" : "Chưa mở"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
