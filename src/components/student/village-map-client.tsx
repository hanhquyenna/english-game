"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Sparkles,
  Users,
  Volume2,
  BookOpen,
  Trophy,
  Compass,
  X,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from "lucide-react";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { StudentAvatar } from "@/components/student-avatar";
import { npcSrc, type NpcCharacter } from "@/components/student/kenney-story-dialog";
import { VillageCanvas } from "@/components/student/village-canvas";
import { VillageDialog } from "@/components/student/village-dialog";
import { VillageFlat } from "@/components/student/village-flat";
import { VillageMinimap } from "@/components/student/village-minimap";
import {
  iso,
  VILLAGE_SQUARE,
  WORLD_BOUNDS,
  fanOffsets,
  type VillageMapData,
  type MapNode,
  type MapLandmark,
  type MapMate,
  type TrackKind,
} from "@/lib/class-map";

interface VillageMapClientProps {
  studentId: string;
  data: VillageMapData;
  studentSummary: {
    name: string;
    gems: number;
    streak: number;
    totalXp: number;
    avatarSeed: string;
    overrides: Record<string, unknown>;
    items: { icon: string; slot: "hat" | "badge"; color?: string; label?: string }[];
    levelNumber: number;
    levelName: string;
  };
}

const WALK_FPS = 10;
const SPEED = 145; // world pixels per second

const clampCam = (c: { x: number; y: number }) => ({
  x: Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, c.x)),
  y: Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, c.y)),
});

export function VillageMapClient({
  studentId,
  data,
  studentSummary,
}: VillageMapClientProps) {
  const router = useRouter();

  useRealtimeRefresh(["topic_progress", "student_avatars"], { debounceMs: 300 });

  const [flat, setFlat] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<MapLandmark | null>(null);
  const [classmatesModalGroup, setClassmatesModalGroup] = useState<MapMate[] | null>(null);

  // Viewport / Camera state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });
  const [cam, setCam] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  // Initial Player position in world coordinates (Spawn in village square by default)
  const initialWorldPos = useMemo(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`bb_v2_pos_${studentId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }
    const sq = iso(VILLAGE_SQUARE.x, VILLAGE_SQUARE.y);
    return { x: sq.x, y: sq.y };
  }, [studentId]);

  const playerPosRef = useRef<{ x: number; y: number }>(initialWorldPos);
  const [renderPos, setRenderPos] = useState<{ x: number; y: number }>(initialWorldPos);
  const [facingLeft, setFacingLeft] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);

  const keysDownRef = useRef<Set<string>>(new Set());
  const autoWalkTargetRef = useRef<{
    x: number;
    y: number;
    node?: MapNode;
    landmark?: MapLandmark;
  } | null>(null);
  const touchJoystickRef = useRef<{ dx: number; dy: number } | null>(null);

  // Preload walk cycle images
  useEffect(() => {
    const charName =
      (studentSummary.overrides?.character as NpcCharacter) || "Female adventurer";
    for (let i = 0; i < 8; i++) {
      const img = new Image();
      img.src = npcSrc(`walk${i}`, charName);
    }
  }, [studentSummary.overrides]);

  // Handle Resize & Camera Bounds
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    setViewport({ width: w, height: h });

    const allPoints: { x: number; y: number }[] = [];
    data.tracks.forEach((t) =>
      t.nodes.forEach((n) => allPoints.push(iso(n.grid.x, n.grid.y)))
    );
    data.landmarks.forEach((lm) => allPoints.push(iso(lm.grid.x, lm.grid.y)));

    const x0 = Math.min(...allPoints.map((p) => p.x));
    const x1 = Math.max(...allPoints.map((p) => p.x));
    const y0 = Math.min(...allPoints.map((p) => p.y));
    const y1 = Math.max(...allPoints.map((p) => p.y));

    if (w > 860) {
      const z = Math.max(
        0.75,
        Math.min(1.4, Math.min((w - 380) / (x1 - x0 + 260), (h - 200) / (y1 - y0 + 300)))
      );
      setZoom(z);
      setCam(
        clampCam({
          x: (x0 + x1) / 2 - 30,
          y: (y0 + y1) / 2,
        })
      );
    } else {
      const z = w > 560 ? 1.15 : 1.0;
      setZoom(z);
      setCam(clampCam({ x: playerPosRef.current.x, y: playerPosRef.current.y }));
    }
  }, [data.tracks, data.landmarks]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  // Center camera on player
  const handleCenterOnPlayer = () => {
    setCam(clampCam({ x: playerPosRef.current.x, y: playerPosRef.current.y }));
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(1.85, +(z + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.55, +(z - 0.15).toFixed(2)));
  };

  // Keyboard events
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(
          e.code
        )
      ) {
        if (e.code.startsWith("Arrow") || e.code === "Space") {
          e.preventDefault();
        }
        keysDownRef.current.add(e.code);
        autoWalkTargetRef.current = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Main Movement & Animation Loop
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;
    let walkTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      let moveX = 0;
      let moveY = 0;

      const keys = keysDownRef.current;
      if (keys.has("KeyW") || keys.has("ArrowUp")) moveY -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) moveY += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) moveX -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) moveX += 1;

      if (touchJoystickRef.current) {
        moveX = touchJoystickRef.current.dx;
        moveY = touchJoystickRef.current.dy;
      }

      if (autoWalkTargetRef.current && moveX === 0 && moveY === 0) {
        const target = autoWalkTargetRef.current;
        const dx = target.x - playerPosRef.current.x;
        const dy = target.y - playerPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          playerPosRef.current = { x: target.x, y: target.y };
          if (target.node) {
            setSelectedNode(target.node);
            setSelectedLandmark(null);
          } else if (target.landmark) {
            setSelectedLandmark(target.landmark);
            setSelectedNode(null);
          }
          autoWalkTargetRef.current = null;
        } else {
          moveX = dx / dist;
          moveY = dy / dist;
        }
      }

      const moving = Math.hypot(moveX, moveY) > 0.01;
      setIsMoving(moving);

      if (moving) {
        const len = Math.hypot(moveX, moveY);
        const normX = moveX / len;
        const normY = moveY / len;

        const nextX = playerPosRef.current.x + normX * SPEED * dt;
        const nextY = playerPosRef.current.y + normY * SPEED * dt;

        playerPosRef.current = { x: nextX, y: nextY };
        setRenderPos({ x: nextX, y: nextY });

        if (normX < -0.1) setFacingLeft(true);
        else if (normX > 0.1) setFacingLeft(false);

        walkTimer += dt;
        const frame = Math.floor(Math.max(0, walkTimer) * WALK_FPS) % 8;
        setWalkFrame(Math.abs(frame));

        if (typeof window !== "undefined") {
          sessionStorage.setItem(`bb_v2_pos_${studentId}`, JSON.stringify(playerPosRef.current));
        }

        // Smooth camera follow with generous 40% dead-zone and smooth lerp
        setCam((prevCam) => {
          const screenX = (nextX - prevCam.x) * zoom;
          const screenY = (nextY - prevCam.y) * zoom;
          const deadZoneX = viewport.width * 0.4;
          const deadZoneY = viewport.height * 0.4;

          let newCamX = prevCam.x;
          let newCamY = prevCam.y;

          if (Math.abs(screenX) > deadZoneX) {
            newCamX += ((screenX - Math.sign(screenX) * deadZoneX) / zoom) * 0.04;
          }
          if (Math.abs(screenY) > deadZoneY) {
            newCamY += ((screenY - Math.sign(screenY) * deadZoneY) / zoom) * 0.04;
          }
          return clampCam({ x: newCamX, y: newCamY });
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [zoom, viewport, studentId]);

  // Tap-to-walk to node
  const handleSelectNode = (trackKind: TrackKind, idx: number) => {
    const track = data.tracks.find((t) => t.kind === trackKind);
    const node = track?.nodes[idx];
    if (!node) return;
    setSelectedNode(node);
    setSelectedLandmark(null);
    const p = iso(node.grid.x, node.grid.y);
    autoWalkTargetRef.current = { x: p.x, y: p.y + 10, node };
  };

  // Tap-to-walk to landmark
  const handleSelectLandmark = (id: string) => {
    const lm = data.landmarks.find((l) => l.id === id);
    if (!lm) return;
    setSelectedLandmark(lm);
    setSelectedNode(null);
    const p = iso(lm.grid.x, lm.grid.y);
    autoWalkTargetRef.current = { x: p.x, y: p.y + 12, landmark: lm };
  };

  // Group classmates by track and nodeIndex
  const classmatesBySpot = useMemo(() => {
    const map = new Map<string, MapMate[]>();
    for (const mate of data.mates) {
      if (mate.isMe) continue;
      const key = `${mate.track}:${mate.nodeIndex}`;
      const list = map.get(key) || [];
      list.push(mate);
      map.set(key, list);
    }
    return map;
  }, [data.mates]);

  const worldToScreen = (wx: number, wy: number) => {
    const sx = Math.round(viewport.width / 2 + (wx - cam.x) * zoom);
    const sy = Math.round(viewport.height / 2 + (wy - cam.y) * zoom);
    return { sx, sy };
  };

  const handleDialogAction = () => {
    if (selectedLandmark) {
      if (selectedLandmark.href) router.push(selectedLandmark.href);
      return;
    }
    if (!selectedNode || selectedNode.status === "locked") return;

    if (selectedNode.isBoss) {
      router.push(`/student/${studentId}/practice/${selectedNode.topicId}?exam=true`);
    } else if (selectedNode.isArenaFinal) {
      router.push(`/student/${studentId}/arena`);
    } else {
      router.push(`/student/${studentId}/practice/${selectedNode.topicId}`);
    }
  };

  const currentPose = isMoving ? `walk${walkFrame}` : "idle";
  const myScreenPos = worldToScreen(renderPos.x, renderPos.y);

  const meMate = useMemo(() => data.mates.find((m) => m.isMe) || data.mates[0], [data.mates]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-st-bg select-none font-sans"
    >
      {/* 1. Open World Terrain Canvas */}
      <VillageCanvas
        tracks={data.tracks}
        landmarks={data.landmarks}
        cam={cam}
        zoom={zoom}
        onSelectNode={handleSelectNode}
        onSelectLandmark={handleSelectLandmark}
        onZoomChange={(newZ) => setZoom(newZ)}
        onPan={(dx, dy) => setCam((prev) => clampCam({ x: prev.x + dx, y: prev.y + dy }))}
      />

      {/* 2. Flat View */}
      {flat && (
        <VillageFlat
          tracks={data.tracks}
          onSelectNode={(track, idx) => {
            setFlat(false);
            handleSelectNode(track, idx);
          }}
        />
      )}

      {/* 3. DOM Avatar Overlay */}
      {!flat && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ willChange: "transform" }}
        >
          {/* Classmates on both tracks */}
          {Array.from(classmatesBySpot.entries()).map(([key, mates]) => {
            const [trackKind, nodeIdxStr] = key.split(":");
            const nodeIdx = Number(nodeIdxStr);
            const track = data.tracks.find((t) => t.kind === trackKind);
            const node = track?.nodes[nodeIdx];
            if (!node) return null;

            const p = iso(node.grid.x, node.grid.y);
            const offsets = fanOffsets(mates.length);
            const shownMates = mates.slice(0, 8);
            const remaining = mates.length - 8;

            return (
              <React.Fragment key={`spot-mates-${key}`}>
                {shownMates.map((mate, i) => {
                  const offset = offsets[i] || { dx: 0, dy: 0 };
                  const worldX = p.x + offset.dx;
                  const worldY = p.y + offset.dy;
                  const { sx, sy } = worldToScreen(worldX, worldY);

                  return (
                    <div
                      key={mate.studentId}
                      className="map-avatar classmate-avatar absolute pointer-events-auto cursor-pointer transition-transform duration-500 ease-out hover:scale-110 active:scale-95"
                      style={{
                        transform: `translate3d(${sx - 15}px, ${sy - 15}px, 0)`,
                        zIndex: 12,
                      }}
                      title={`${mate.name} (Bấm xem hồ sơ)`}
                      onClick={() =>
                        router.push(`/student/${studentId}/profile/${mate.studentId}`)
                      }
                    >
                      <StudentAvatar
                        seed={mate.seed}
                        overrides={mate.overrides}
                        items={mate.items}
                        size={30}
                        noFrame
                        pose="idle"
                      />
                    </div>
                  );
                })}

                {/* +N Chip if >8 classmates */}
                {remaining > 0 && (() => {
                  const { sx, sy } = worldToScreen(p.x + 40, p.y + 26);
                  return (
                    <button
                      key={`plus-${key}`}
                      onClick={() => setClassmatesModalGroup(mates)}
                      className="absolute pointer-events-auto z-14 px-1.5 py-0.5 text-[10px] font-bold bg-st-card border-2 border-st-fg shadow-[2px_2px_0_0_var(--st-fg)] rounded-sm text-st-fg hover:bg-st-peach active:translate-x-0.5 active:translate-y-0.5"
                      style={{
                        transform: `translate3d(${sx}px, ${sy}px, 0)`,
                      }}
                    >
                      +{remaining}
                    </button>
                  );
                })()}
              </React.Fragment>
            );
          })}

          {/* Player avatar (EM) */}
          <div
            id="my-avatar"
            className="map-avatar absolute pointer-events-auto z-20 transition-none"
            style={{
              transform: `translate3d(${myScreenPos.sx - 23}px, ${myScreenPos.sy - 30}px, 0)`,
            }}
          >
            <div
              className="relative flex flex-col items-center"
              style={{
                transform: facingLeft ? "scaleX(-1)" : "none",
              }}
            >
              <StudentAvatar
                seed={meMate.seed}
                overrides={meMate.overrides}
                items={meMate.items}
                size={46}
                noFrame
                pose={currentPose}
                ring="var(--st-primary)"
                ringWidth={3}
                glow="0 0 10px rgba(199,91,57,0.6)"
              />
            </div>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase text-st-primary-fg bg-st-primary border border-st-fg rounded-sm shadow-[1.5px_1.5px_0_0_var(--st-fg)]">
              EM
            </span>
          </div>
        </div>
      )}

      {/* 4. HUD Controls & Panels */}
      {/* Top Left: Player Card */}
      <div
        id="player"
        className="hud absolute top-2.5 left-2.5 z-30 flex items-center gap-2 p-2 bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)]"
      >
        <div className="w-9 h-9 border-2 border-st-fg rounded-sm bg-st-peach flex items-center justify-center overflow-hidden shrink-0">
          <StudentAvatar
            seed={studentSummary.avatarSeed}
            overrides={studentSummary.overrides}
            items={studentSummary.items}
            size={34}
            noFrame
            pose="idle"
          />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-st-fg">{studentSummary.name}</div>
          <div className="text-[9px] font-semibold text-st-muted-fg tracking-wider uppercase">
            Cấp {studentSummary.levelNumber} · {studentSummary.levelName}
          </div>
          <div className="mt-1 w-24 h-2 bg-st-muted border border-st-fg rounded-xs overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-st-accent to-st-primary"
              style={{ width: `${Math.min(100, studentSummary.totalXp % 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Right: Status Chips */}
      <div
        id="chips"
        className="hud absolute top-2.5 right-2.5 z-30 flex flex-wrap gap-1.5 justify-end max-w-[60vw]"
      >
        <div className="chip flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-st-card border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)]">
          <Flame className="w-3.5 h-3.5 text-st-primary" />
          <span className="font-mono">{studentSummary.streak}</span>
        </div>
        <div className="chip flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-st-card border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)]">
          <Sparkles className="w-3.5 h-3.5 text-st-accent" />
          <span className="font-mono">{studentSummary.gems}</span>
        </div>
        <div className="chip flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-st-card border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)]">
          <Users className="w-3.5 h-3.5 text-st-secondary" />
          <span className="font-mono">{data.mates.length}</span>
        </div>
      </div>

      {/* Class Progress Bar */}
      <div
        id="classbar"
        className="hud absolute top-14 right-2.5 z-30 w-52 p-2 bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hidden md:block"
      >
        <div className="flex justify-between items-baseline mb-1">
          <b className="text-xs font-bold">Lớp {data.className}</b>
          <span className="text-[10px] text-st-muted-fg font-medium">
            {data.classUnlocked}/{data.totalNodes} mở
          </span>
        </div>
        <div className="h-2.5 bg-st-muted border border-st-fg rounded-xs overflow-hidden">
          <div
            className="h-full bg-st-secondary transition-all duration-500"
            style={{ width: `${(data.classUnlocked / data.totalNodes) * 100}%` }}
          />
        </div>
      </div>

      {/* Quests Panel */}
      <div
        id="quests"
        className="hud absolute top-28 right-2.5 z-30 w-52 p-2.5 bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] max-h-[44vh] overflow-auto hidden md:block"
      >
        <h3 className="text-[10px] font-bold tracking-wider uppercase text-st-muted-fg mb-2">
          Việc của em
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 pt-1 border-t border-dashed border-st-input first:border-0 first:pt-0">
            <span className="w-2 h-2 rounded-xs bg-st-primary mt-1 shrink-0 border border-st-fg" />
            <div>
              <div className="font-bold text-st-fg">Đường Học: Thử thách</div>
              <div className="text-[10px] text-st-muted-fg">8 bài học + Trùm cuối</div>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-dashed border-st-input">
            <span className="w-2 h-2 rounded-xs bg-st-secondary mt-1 shrink-0 border border-st-fg" />
            <div>
              <div className="font-bold text-st-fg">Đường Đấu: Thư viện</div>
              <div className="text-[10px] text-st-muted-fg">Tự luyện & Đấu trường Arena</div>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-dashed border-st-input">
            <span className="w-2 h-2 rounded-xs bg-st-accent mt-1 shrink-0 border border-st-fg" />
            <div>
              <div className="font-bold text-st-fg">Kho từ vựng Spaced</div>
              <div className="text-[10px] text-st-muted-fg">Flashcards hàng ngày</div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimap */}
      <VillageMinimap
        tracks={data.tracks}
        landmarks={data.landmarks}
        mates={data.mates}
        cam={cam}
        className="absolute bottom-3 right-2.5 z-30"
      />

      {/* Zoom & Center Floating Tool Widget */}
      <div className="hud absolute bottom-28 left-2.5 z-30 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)] text-st-fg hover:bg-st-peach active:translate-x-0.5 active:translate-y-0.5"
          title="Phóng to bản đồ"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)] text-st-fg hover:bg-st-peach active:translate-x-0.5 active:translate-y-0.5"
          title="Thu nhỏ bản đồ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleCenterOnPlayer}
          className="w-9 h-9 grid place-items-center bg-st-primary text-st-primary-fg border-2 border-st-fg rounded-sm shadow-[2px_2px_0_0_var(--st-fg)] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5"
          title="Định vị nhân vật EM"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* View Toggle */}
      <div
        id="view"
        className="hud absolute bottom-16 left-2.5 z-30 flex border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] overflow-hidden bg-st-card"
      >
        <button
          id="bIso"
          aria-pressed={!flat}
          onClick={() => setFlat(false)}
          className={`px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors ${
            !flat ? "bg-st-primary text-st-primary-fg" : "text-st-muted-fg hover:bg-st-peach"
          }`}
        >
          Làng
        </button>
        <button
          id="bFlat"
          aria-pressed={flat}
          onClick={() => setFlat(true)}
          className={`px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase border-l-2 border-st-fg transition-colors ${
            flat ? "bg-st-primary text-st-primary-fg" : "text-st-muted-fg hover:bg-st-peach"
          }`}
        >
          Sơ đồ
        </button>
      </div>

      {/* Tool Belt */}
      <div id="belt" className="hud absolute bottom-3 left-2.5 z-30 flex gap-1.5">
        <Link
          href={`/student/${studentId}/roleplay`}
          className="w-10 h-10 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
          title="Luyện nói AI"
        >
          <Volume2 className="w-4 h-4 text-st-fg" />
        </Link>
        <Link
          href={`/student/${studentId}/vault`}
          className="w-10 h-10 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
          title="Kho từ vựng"
        >
          <BookOpen className="w-4 h-4 text-st-fg" />
        </Link>
        <Link
          href={`/student/${studentId}/arena`}
          className="w-10 h-10 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
          title="Đấu trường Arena"
        >
          <Trophy className="w-4 h-4 text-st-fg" />
        </Link>
        <Link
          href={`/student/${studentId}`}
          className="w-10 h-10 grid place-items-center bg-st-card border-2 border-st-fg rounded-sm shadow-[3px_3px_0_0_var(--st-fg)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
          title="Thế giới Beeblast"
        >
          <Compass className="w-4 h-4 text-st-fg" />
        </Link>
      </div>

      {/* 5. Village Dialog */}
      <VillageDialog
        selectedNode={selectedNode}
        selectedLandmark={selectedLandmark}
        classmatesAtNode={
          selectedNode
            ? classmatesBySpot.get(`${selectedNode.track}:${selectedNode.index}`) || []
            : []
        }
        arenaUnlocked={data.arenaUnlocked}
        arenaLockedReason={data.arenaLockedReason}
        onClose={() => {
          setSelectedNode(null);
          setSelectedLandmark(null);
        }}
        onAction={handleDialogAction}
      />

      {/* 6. Classmates List Modal for a spot with >8 classmates */}
      {classmatesModalGroup !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-st-card border-2 border-st-fg rounded-sm shadow-[4px_4px_0_0_var(--st-fg)] w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b-2 border-st-fg bg-st-peach">
              <h3 className="font-bold text-sm text-st-fg">Danh sách các bạn</h3>
              <button
                onClick={() => setClassmatesModalGroup(null)}
                className="w-6 h-6 flex items-center justify-center border-2 border-st-fg rounded-sm bg-st-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {classmatesModalGroup.map((m) => (
                <div
                  key={m.studentId}
                  onClick={() => {
                    setClassmatesModalGroup(null);
                    router.push(`/student/${studentId}/profile/${m.studentId}`);
                  }}
                  className="flex items-center gap-3 p-2 bg-st-bg border border-st-fg rounded-sm cursor-pointer hover:bg-st-peach transition-colors"
                >
                  <StudentAvatar
                    seed={m.seed}
                    overrides={m.overrides}
                    items={m.items}
                    size={32}
                    noFrame
                    pose="idle"
                  />
                  <div className="font-bold text-xs text-st-fg">{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
