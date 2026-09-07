"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle,
  Flame,
  Lock,
  LogOut,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Mono } from "@/components/student/ui";
import { StudentAvatar } from "@/components/student-avatar";
import type { Island } from "@/lib/islands";

export type LeagueTier = "CHAMPION" | "DIAMOND" | "GOLD" | "BRONZE";

export function ArenaClient({
  studentId,
  cefrBand,
  islands,
  streak,
  levelNumber,
  studentSeed,
  studentOverrides,
}: {
  studentId: string;
  cefrBand: string;
  islands: Island[];
  streak: number;
  levelNumber: number;
  studentSeed?: string;
  studentOverrides?: any;
  studentItems?: any;
  leagueUnlocked?: boolean;
  leagueTier?: LeagueTier;
  leaderboard?: any[];
}) {
  const router = useRouter();
  const [selectedIslandModal, setSelectedIslandModal] = useState<Island | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);

  // Unlimited Drag & Scroll Map Coordinates for Arena Skill Nodes
  const arenaNodeCoords = [
    { x: 15, y: 30 },
    { x: 35, y: 55 },
    { x: 55, y: 35 },
    { x: 75, y: 60 },
    { x: 88, y: 40 },
  ];

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#1e3a5f] select-none font-sans flex flex-col">
      {/* FLOATING TOP GAME HUD OVERLAY */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Top-Left: Level Capsule with Clickable Profile Avatar */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border-2 border-st-fg bg-black/85 p-1.5 pr-4 shadow-2xl backdrop-blur-md">
          {/* Clickable Profile Avatar Button */}
          <Link href={`/student/${studentId}/profile`}>
            <button className="flex size-9 items-center justify-center rounded-full border-2 border-st-fg bg-st-peach shadow-md transition-transform active:scale-95 hover:ring-2 hover:ring-st-primary overflow-hidden">
              <StudentAvatar
                seed={studentSeed ?? "arena-seed"}
                overrides={studentOverrides}
                size={32}
                shape="circle"
              />
            </button>
          </Link>

          {/* Level Progress Bar */}
          <button
            onClick={() => setShowExpModal(true)}
            className="flex flex-col items-start text-left transition-transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="st-display text-xs font-black text-st-accent uppercase tracking-wide">
                Level {levelNumber}
              </span>
              <Mono className="text-[9px] font-black text-white">420 / 600 EXP</Mono>
            </div>
            <div className="w-32 h-2 rounded-full bg-black/60 border border-st-accent/60 overflow-hidden p-0.5 mt-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent/60 shadow-sm w-[85%]" />
            </div>
          </button>
        </div>

        {/* Top-Right Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border-2 border-st-fg bg-st-accent px-3 py-1.5 shadow-xl backdrop-blur-md">
            <Flame size={15} className="text-st-fg" />
            <Mono className="text-xs font-black text-st-fg">{streak}d streak</Mono>
          </span>
        </div>
      </div>

      {/* BOTTOM-LEFT CORNER: QUIT TO MAP BUTTON */}
      <div className="absolute bottom-4 left-4 z-40">
        <Link href={`/student/${studentId}`}>
          <button className="flex items-center gap-2 rounded-2xl border-3 border-st-fg bg-st-primary px-4 py-2.5 text-xs font-black text-st-primary-fg uppercase shadow-2xl transition-transform active:scale-95 hover:scale-105">
            <LogOut size={16} />
            <span>QUIT TO MAP</span>
          </button>
        </Link>
      </div>

      {/* CRAFTPIX TWILIGHT NATURE PIXEL ART ARENA MAP CANVAS */}
      <div className="relative flex-1 w-full overflow-auto scrollbar-none cursor-grab active:cursor-grabbing">
        <div
          className="relative min-w-[1600px] min-h-[900px] w-full h-full overflow-hidden"
          style={{
            backgroundImage: `url(/craftpix/nature-backgrounds/nature_4/origbig.png)`,
            backgroundRepeat: "repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* SVG GOLDEN BATTLE PATH CONNECTING ARENA STATIONS */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
            <path
              d="M 15% 30% Q 25% 42.5%, 35% 55% T 55% 35% T 75% 60% T 88% 40%"
              fill="none"
              stroke="#1a0f2b"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M 15% 30% Q 25% 42.5%, 35% 55% T 55% 35% T 75% 60% T 88% 40%"
              fill="none"
              stroke="#e6ca9c"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 15% 30% Q 25% 42.5%, 35% 55% T 55% 35% T 75% 60% T 88% 40%"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="8 8"
            />
          </svg>

          {/* UNLIMITED ARENA PRACTICE STATIONS */}
          {islands.map((island, idx) => {
            const coord = arenaNodeCoords[idx % arenaNodeCoords.length];
            const isDone = island.percentComplete >= 100;
            return (
              <div
                key={island.topicId}
                onClick={() => setSelectedIslandModal(island)}
                className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              >
                {/* Badge */}
                <div className="mb-1 flex flex-col items-center">
                  <Mono className="rounded-md border-2 border-st-fg bg-st-accent px-2.5 py-0.5 text-[9px] font-black text-st-fg shadow-md uppercase">
                    ARENA STATION {idx + 1}
                  </Mono>
                </div>

                {/* Platform Node Asset */}
                <div className="relative flex size-16 items-center justify-center rounded-2xl border-4 border-st-fg bg-st-card shadow-2xl transition-transform hover:rotate-3">
                  <Award className="size-9 text-st-primary" />
                  {isDone ? (
                    <CheckCircle className="absolute -top-2 -right-2 size-7 text-st-secondary fill-st-secondary bg-white rounded-full border border-st-fg" />
                  ) : null}
                </div>

                {/* Station Title */}
                <div className="mt-1.5 text-center bg-black/85 px-3 py-1 rounded-xl border border-white/20 shadow-lg">
                  <span className="st-display text-xs font-black text-white block whitespace-nowrap">
                    {island.name}
                  </span>
                  <Mono className="text-[9px] font-extrabold text-st-accent block">
                    CEFR {cefrBand} Battle Station
                  </Mono>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXP LEARNING DATA MODAL */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative border-4 border-st-fg p-6 rounded-3xl w-full max-w-md bg-st-card text-st-fg space-y-4 shadow-2xl">
            <button
              onClick={() => setShowExpModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full border-2 border-st-fg bg-st-bg text-st-fg hover:bg-st-peach"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <Zap size={24} className="text-st-primary" />
              <div>
                <h3 className="st-display text-xl font-black">Level & EXP Learning Data</h3>
                <Mono className="text-xs text-st-muted-fg font-bold">CEFR {cefrBand} Arena Progress</Mono>
              </div>
            </div>

            <div className="bg-st-peach p-3.5 rounded-2xl border-2 border-st-fg space-y-2">
              <div className="flex justify-between text-xs font-black">
                <span>Level {levelNumber}</span>
                <Mono className="text-st-primary font-bold">420 / 600 EXP</Mono>
              </div>
              <div className="w-full h-3 rounded-full bg-st-bg border border-st-fg overflow-hidden">
                <div className="h-full bg-st-primary w-[85%]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Mastered Words</Mono>
                <span className="st-display text-xl font-black text-st-fg">8 Words</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Grammar Rules</Mono>
                <span className="st-display text-xl font-black text-st-fg">12 Rules</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Daily Streak</Mono>
                <span className="st-display text-xl font-black text-st-fg">{streak} Days</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Star Reward Points</Mono>
                <span className="st-display text-xl font-black text-st-fg">64 Stars</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARENA STATION PRACTICE LAUNCH MODAL */}
      {selectedIslandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative border-4 border-st-fg p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 text-center"
            style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
          >
            <button
              onClick={() => setSelectedIslandModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full border-2 border-st-fg bg-st-bg hover:bg-st-peach text-st-fg"
            >
              <X size={16} />
            </button>

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-st-fg bg-st-peach p-2 shadow-inner relative overflow-hidden">
              <Award className="size-12 text-st-primary" />
            </div>

            <div>
              <h3 className="st-display text-xl font-black text-st-fg">
                {selectedIslandModal.name}
              </h3>
              <p className="text-xs text-st-muted-fg mt-1.5 font-medium leading-relaxed">
                CEFR {cefrBand} Unlimited Practice Station
              </p>
            </div>

            <div className="pt-2">
              <Link href={`/student/${studentId}/practice/${selectedIslandModal.topicId}`}>
                <button
                  type="button"
                  className="w-full py-3 px-4 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-st-fg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--st-primary)",
                    color: "var(--st-primary-fg)",
                  }}
                >
                  <Sparkles size={16} /> Start Arena Practice
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
