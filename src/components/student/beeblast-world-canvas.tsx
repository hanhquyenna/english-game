"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flame,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Mono } from "@/components/student/ui";
import { StudentAvatar } from "@/components/student-avatar";
import { npcSrc, type NpcCharacter } from "@/components/student/kenney-story-dialog";

interface LocationHotspot {
  id: "learn" | "challenges" | "vault" | "arena" | "roleplay" | "shop" | "pet" | "rank";
  title: string;
  subtitle: string;
  x: number; // 0-100%
  y: number; // 0-100%
  assetUrl: string;
  npcCharacter: NpcCharacter;
  npcPose: string;
  dialogTitle: string;
  dialogBody: string;
  ctaText: string;
  ctaHref: string;
  badge: string;
}

const INSTITUTIONS: LocationHotspot[] = [
  {
    id: "learn",
    title: "Lộ trình Lớp học (Class Map)",
    subtitle: "Bản đồ 2D & Nhân vật di chuyển",
    x: 22,
    y: 35,
    assetUrl: "/kenney/mini-forest/Previews/building-structure.png",
    npcCharacter: "Female adventurer",
    npcPose: "cheer0",
    dialogTitle: "Lộ trình Lớp học",
    dialogBody: "Khám phá bản đồ 2D của lớp, đồng hành cùng các bạn và chinh phục 8 thử thách cùng trùm cuối!",
    ctaText: "Vào Bản đồ lớp",
    ctaHref: "class-map",
    badge: "BẢN ĐỒ LỚP",
  },
  {
    id: "challenges",
    title: "Challenges Guild Institution",
    subtitle: "Homework Units & Exams",
    x: 50,
    y: 32,
    assetUrl: "/kenney/mini-forest/Previews/tent.png",
    npcCharacter: "Male adventurer",
    npcPose: "talk",
    dialogTitle: "Challenges Guild Institution",
    dialogBody: "Enter the Guild to complete assigned homework units and weekly exams!",
    ctaText: "Enter Challenges Guild",
    ctaHref: "challenges",
    badge: "CHALLENGES",
  },
  {
    id: "vault",
    title: "Vault Bank Institution",
    subtitle: "Word Bank & Flashcards",
    x: 76,
    y: 32,
    assetUrl: "/kenney/mini-forest/Previews/rocks-high.png",
    npcCharacter: "Female person",
    npcPose: "think",
    dialogTitle: "Vault Bank Institution",
    dialogBody: "Review your saved vocabulary words and spaced-repetition flashcards!",
    ctaText: "Enter Vault Bank",
    ctaHref: "vault",
    badge: "VAULT BANK",
  },
  {
    id: "arena",
    title: "Arena Stadium Open World",
    subtitle: "Mistake Review & Skill Boost",
    x: 78,
    y: 68,
    assetUrl: "/kenney/mini-forest/Previews/building-platform.png",
    npcCharacter: "Male person",
    npcPose: "cheer0",
    dialogTitle: "Arena Stadium Open World",
    dialogBody: "Explore the 2D Open-World Arena to review mistakes and boost your core language skills!",
    ctaText: "Enter Open-World Arena",
    ctaHref: "arena",
    badge: "OPEN-WORLD ARENA",
  },
  {
    id: "rank",
    title: "Leaderboard Hall of Fame",
    subtitle: "Student Leaderboard & Ranks",
    x: 24,
    y: 72,
    assetUrl: "/kenney/mini-forest/Previews/target.png",
    npcCharacter: "Female adventurer",
    npcPose: "cheer0",
    dialogTitle: "Leaderboard Hall of Fame",
    dialogBody: "See where you rank among classmates in total stars and daily streaks!",
    ctaText: "Enter Hall of Fame",
    ctaHref: "rank",
    badge: "LEADERBOARD",
  },
  {
    id: "shop",
    title: "Avatar Marketplace",
    subtitle: "Character & Accessory Shop",
    x: 52,
    y: 72,
    assetUrl: "/kenney/mini-forest/Previews/platform.png",
    npcCharacter: "Male person",
    npcPose: "idle",
    dialogTitle: "Avatar Marketplace",
    dialogBody: "Unlock new Kenney Toon Characters, poses, hats, and shiny accessories!",
    ctaText: "Visit Avatar Shop",
    ctaHref: "shop",
    badge: "AVATAR SHOP",
  },
];

export function BeeblastWorldCanvas({
  studentId,
  seed,
  overrides,
  gems,
  streak,
  levelNumber,
  cefrBand,
}: {
  studentId: string;
  seed: string;
  overrides?: any;
  gems: number;
  streak: number;
  levelNumber: number;
  cefrBand: string;
}) {
  const router = useRouter();
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 52 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  const [nearbyLocation, setNearbyLocation] = useState<LocationHotspot | null>(null);
  const [selectedLocationModal, setSelectedLocationModal] = useState<LocationHotspot | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);

  const keysPressed = useRef<Record<string, boolean>>({});
  const touchVector = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let frameCounter = 0;

    const gameLoop = () => {
      let dx = 0;
      let dy = 0;

      if (keysPressed.current["w"] || keysPressed.current["ArrowUp"]) dy -= 1;
      if (keysPressed.current["s"] || keysPressed.current["ArrowDown"]) dy += 1;
      if (keysPressed.current["a"] || keysPressed.current["ArrowLeft"]) dx -= 1;
      if (keysPressed.current["d"] || keysPressed.current["ArrowRight"]) dx += 1;

      if (touchVector.current.dx !== 0 || touchVector.current.dy !== 0) {
        dx = touchVector.current.dx;
        dy = touchVector.current.dy;
      }

      const moving = dx !== 0 || dy !== 0;
      setIsMoving(moving);

      if (moving) {
        if (dx < 0) setFacingLeft(true);
        if (dx > 0) setFacingLeft(false);

        const len = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.45;
        const ndx = (dx / len) * speed;
        const ndy = (dy / len) * speed;

        setPlayerPos((prev) => {
          const nx = Math.max(5, Math.min(95, prev.x + ndx));
          const ny = Math.max(10, Math.min(90, prev.y + ndy));

          let closestLoc: LocationHotspot | null = null;
          let minDistance = 999;

          INSTITUTIONS.forEach((loc) => {
            const dist = Math.sqrt(
              Math.pow(nx - loc.x, 2) + Math.pow(ny - loc.y, 2),
            );
            if (dist < 14 && dist < minDistance) {
              minDistance = dist;
              closestLoc = loc;
            }
          });

          setNearbyLocation(closestLoc);
          return { x: nx, y: ny };
        });

        frameCounter++;
        if (frameCounter % 6 === 0) {
          setWalkFrame((f) => (f + 1) % 8);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysPressed.current[e.key] = true;

      if ((e.key === "e" || e.key === "E" || e.key === " ") && nearbyLocation) {
        setSelectedLocationModal(nearbyLocation);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [nearbyLocation]);

  const setTouchDir = (dx: number, dy: number) => {
    touchVector.current = { dx, dy };
  };

  const walkPose = isMoving ? `walk${walkFrame}` : "idle";

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#2d4c1e] select-none font-sans flex flex-col">
      {/* FLOATING TOP GAME HUD OVERLAY (NO FULL-WIDTH WHITE BAR CONTAINER) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Glossy Level & EXP Progress Bar Capsule */}
        <button
          onClick={() => setShowExpModal(true)}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full border-2 border-st-fg bg-black/80 p-1.5 pr-4 shadow-2xl backdrop-blur-md transition-transform active:scale-95 hover:scale-105"
        >
          {/* Glowing Yellow Lightning Bolt */}
          <div className="flex size-8 items-center justify-center rounded-full bg-st-accent text-st-fg shadow-md border border-st-fg shrink-0">
            <Zap size={18} className="fill-st-fg text-st-fg" />
          </div>

          <div className="flex flex-col items-start">
            <div className="flex items-center justify-between w-full gap-4">
              <span className="st-display text-xs font-black text-st-accent uppercase tracking-wide">
                Level {levelNumber}
              </span>
              <Mono className="text-[10px] font-black text-white">420 / 600 EXP</Mono>
            </div>
            {/* Visual Level Progress Fill Tube */}
            <div className="w-36 h-2.5 rounded-full bg-black/60 border border-st-accent/60 overflow-hidden p-0.5 mt-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent/60 shadow-sm w-[70%]" />
            </div>
          </div>
        </button>

        {/* Right Floating Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-full border-2 border-st-fg bg-st-accent px-3 py-1.5 shadow-xl backdrop-blur-md">
            <Flame size={16} className="text-st-fg" />
            <Mono className="text-xs font-black text-st-fg">{streak}d streak</Mono>
          </span>

          <Link href={`/student/${studentId}/profile`}>
            <button className="flex items-center gap-1.5 rounded-full border-2 border-st-fg bg-st-card p-1 transition-transform active:scale-95 shadow-xl hover:ring-2 hover:ring-st-primary">
              <StudentAvatar
                seed={seed}
                overrides={overrides}
                size={34}
                shape="circle"
              />
            </button>
          </Link>
        </div>
      </div>

      {/* FULL PRE-RENDERED KENNEY MINI-FOREST WORLD MAP CANVAS */}
      <div
        className="relative flex-1 w-full overflow-hidden cursor-crosshair"
        style={{
          backgroundImage: `url(/kenney/mini-forest/Sample.png)`,
          backgroundSize: "105% 125%",
          backgroundPosition: "center top",
        }}
      >
        {/* DEDICATED INSTITUTIONS (NO WHITE SQUARE BOX) */}
        {INSTITUTIONS.map((loc) => {
          const isNear = nearbyLocation?.id === loc.id;
          return (
            <div
              key={loc.id}
              onClick={() => setSelectedLocationModal(loc)}
              className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-105"
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            >
              <div className="mb-1 flex flex-col items-center animate-bounce">
                <div className="h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-st-accent drop-shadow-md" />
                <Mono className="rounded-md border-2 border-st-fg bg-st-accent px-1.5 py-0.5 text-[8px] font-black text-st-fg shadow-sm uppercase">
                  {loc.badge}
                </Mono>
              </div>

              <div className={`relative transition-transform ${isNear ? "scale-125 drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]" : "drop-shadow-lg"}`}>
                <img
                  src={loc.assetUrl}
                  alt={loc.title}
                  className="h-20 w-20 object-contain"
                />
                <img
                  src={npcSrc(loc.npcPose, loc.npcCharacter)}
                  alt=""
                  className="absolute -right-2 -bottom-2 h-10 object-contain drop-shadow-sm"
                />
              </div>

              <div className="mt-1 text-center">
                <span className="st-display text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] whitespace-nowrap block">
                  {loc.title}
                </span>
                <Mono className="text-[9px] font-extrabold text-st-peach drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  {loc.subtitle}
                </Mono>
              </div>
            </div>
          );
        })}

        {/* PLAYER CHARACTER (NO SQUARE BOX) */}
        <div
          className="absolute z-30 transition-none transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
            transform: `translate(-50%, -100%) scaleX(${facingLeft ? -1 : 1})`,
          }}
        >
          <div
            className="mx-auto mb-1 flex items-center justify-center rounded-md border-2 border-st-fg bg-black/80 px-2 py-0.5 shadow-md"
            style={{ transform: `scaleX(${facingLeft ? -1 : 1})` }}
          >
            <Mono className="text-[9px] font-black text-st-accent uppercase whitespace-nowrap">
              Student #1
            </Mono>
          </div>

          <StudentAvatar
            seed={seed}
            overrides={overrides}
            size={56}
            pose={walkPose}
            noFrame={true}
          />
        </div>

        {/* PROXIMITY OVERLAY */}
        {nearbyLocation && (
          <div
            className="absolute z-40 transform -translate-x-1/2 -translate-y-full pointer-events-none animate-bounce"
            style={{
              left: `${playerPos.x}%`,
              top: `${playerPos.y - 12}%`,
            }}
          >
            <div className="rounded-xl border-2 border-st-fg bg-st-peach px-3 py-1.5 shadow-xl text-center">
              <span className="st-display text-xs font-black text-st-fg block">
                {nearbyLocation.title}
              </span>
              <Mono className="text-[9px] font-extrabold text-st-primary uppercase block">
                Press ENTER or Tap INTERACT (E)
              </Mono>
            </div>
          </div>
        )}

        {/* VIRTUAL D-PAD CONTROLS */}
        <div className="absolute bottom-4 left-4 z-40 flex flex-col items-center gap-1">
          <button
            onMouseDown={() => setTouchDir(0, -1)}
            onMouseUp={() => setTouchDir(0, 0)}
            onTouchStart={() => setTouchDir(0, -1)}
            onTouchEnd={() => setTouchDir(0, 0)}
            className="size-11 rounded-lg border-2 border-st-fg bg-st-card active:bg-st-primary text-st-fg flex items-center justify-center shadow-lg"
          >
            <ArrowUp size={20} />
          </button>
          <div className="flex gap-1">
            <button
              onMouseDown={() => setTouchDir(-1, 0)}
              onMouseUp={() => setTouchDir(0, 0)}
              onTouchStart={() => setTouchDir(-1, 0)}
              onTouchEnd={() => setTouchDir(0, 0)}
              className="size-11 rounded-lg border-2 border-st-fg bg-st-card active:bg-st-primary text-st-fg flex items-center justify-center shadow-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onMouseDown={() => setTouchDir(0, 1)}
              onMouseUp={() => setTouchDir(0, 0)}
              onTouchStart={() => setTouchDir(0, 1)}
              onTouchEnd={() => setTouchDir(0, 0)}
              className="size-11 rounded-lg border-2 border-st-fg bg-st-card active:bg-st-primary text-st-fg flex items-center justify-center shadow-lg"
            >
              <ArrowDown size={20} />
            </button>
            <button
              onMouseDown={() => setTouchDir(1, 0)}
              onMouseUp={() => setTouchDir(0, 0)}
              onTouchStart={() => setTouchDir(1, 0)}
              onTouchEnd={() => setTouchDir(0, 0)}
              className="size-11 rounded-lg border-2 border-st-fg bg-st-card active:bg-st-primary text-st-fg flex items-center justify-center shadow-lg"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* PROXIMITY INTERACT BUTTON */}
        {nearbyLocation && (
          <div className="absolute bottom-4 right-4 z-40">
            <button
              onClick={() => setSelectedLocationModal(nearbyLocation)}
              className="flex items-center gap-2 rounded-2xl border-4 border-st-fg bg-st-primary px-5 py-3.5 shadow-2xl transition-transform active:scale-95 animate-pulse"
            >
              <Sparkles size={22} className="text-st-primary-fg" />
              <div className="text-left">
                <span className="st-display text-sm font-black text-st-primary-fg uppercase block leading-tight">
                  INTERACT (E)
                </span>
                <Mono className="text-[10px] text-st-primary-fg/90 font-bold block">
                  {nearbyLocation.title}
                </Mono>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* EXP LEARNING DATA MODAL (CLICKING EXP BAR AT TOP) */}
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
                <Mono className="text-xs text-st-muted-fg font-bold">CEFR {cefrBand} Level Progress</Mono>
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="bg-st-peach p-3.5 rounded-2xl border-2 border-st-fg space-y-2">
              <div className="flex justify-between text-xs font-black">
                <span>Level {levelNumber}</span>
                <Mono className="text-st-primary font-bold">420 / 600 EXP</Mono>
              </div>
              <div className="w-full h-3 rounded-full bg-st-bg border border-st-fg overflow-hidden">
                <div className="h-full bg-st-primary w-[70%]" />
              </div>
              <Mono className="text-[10px] text-st-muted-fg font-bold block text-center">
                +180 EXP needed to level up to Level {levelNumber + 1}!
              </Mono>
            </div>

            {/* Learning Metrics Grid */}
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

      {/* FEATURE INSTITUTION MODAL DIALOG */}
      {selectedLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative border-4 border-st-fg p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 text-center"
            style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
          >
            <button
              onClick={() => setSelectedLocationModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full border-2 border-st-fg bg-st-bg hover:bg-st-peach text-st-fg"
            >
              <X size={16} />
            </button>

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-st-fg bg-st-peach p-2 shadow-inner relative overflow-hidden">
              <img
                src={selectedLocationModal.assetUrl}
                alt=""
                className="h-16 w-16 object-contain"
              />
              <img
                src={npcSrc(selectedLocationModal.npcPose, selectedLocationModal.npcCharacter)}
                alt=""
                className="absolute bottom-1 right-1 h-12 object-contain"
              />
            </div>

            <div>
              <h3 className="st-display text-xl font-black text-st-fg">
                {selectedLocationModal.dialogTitle}
              </h3>
              <p className="text-xs text-st-muted-fg mt-1.5 font-medium leading-relaxed">
                {selectedLocationModal.dialogBody}
              </p>
            </div>

            <div className="pt-2">
              <Link href={`/student/${studentId}/${selectedLocationModal.ctaHref}`}>
                <button
                  type="button"
                  className="w-full py-3 px-4 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-st-fg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--st-primary)",
                    color: "var(--st-primary-fg)",
                  }}
                >
                  <Sparkles size={16} /> {selectedLocationModal.ctaText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
