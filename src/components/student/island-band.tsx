import Link from "next/link";
import { Award, Check, Lock, Map, Star, Triangle } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Mono, Tile } from "@/components/student/ui";
import type { Island } from "@/lib/islands";
import type { PeepConfig } from "@/lib/peeps";

/**
 * One island band on the Learn path — rendered as an organic, winding forest map
 * using Kenney mini-forest assets and a continuous SVG winding road ribbon.
 */

const ISLAND_ICONS = [Map, Triangle, Award];

const MF_BASE = "/kenney/mini-forest/Previews";

export function IslandBand({
  studentId,
  island,
  index,
  here,
  seed,
  overrides,
}: {
  studentId: string;
  island: Island;
  index: number;
  here: { topicId: string; level: number } | null;
  seed: string;
  overrides: Partial<PeepConfig>;
}) {
  const Glyph = ISLAND_ICONS[index % ISLAND_ICONS.length];

  // Calculate coordinates for the 7 nodes along the winding curve
  // Row height is ~88px. Amplitude is 70px around center 175px (in 350px viewport)
  const nodeCoords = island.nodes.map((_, i) => {
    const x = 175 + Math.sin(i * 0.85) * 70;
    const y = 50 + i * 88;
    return { x, y };
  });

  // Construct SVG cubic bezier curve connecting node points smoothly
  const svgPathD = nodeCoords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = nodeCoords[i - 1];
    const cy1 = prev.y + 44;
    const cy2 = pt.y - 44;
    return `${acc} C ${prev.x} ${cy1}, ${pt.x} ${cy2}, ${pt.x} ${pt.y}`;
  }, "");

  const totalHeight = 50 + island.nodes.length * 88;

  return (
    <Tile
      className="mx-[14px] mt-5 overflow-hidden pb-6 pt-4 relative border-2 border-st-fg"
      style={{
        backgroundColor: "#7ca942", // Rich forest meadow grass green
        backgroundImage: `radial-gradient(#8ec14d 15%, transparent 16%)`,
        backgroundSize: "20px 20px",
      }}
    >
      {/* Header banner */}
      <header className="flex items-center gap-2.5 px-4 pb-4 relative z-20">
        <span
          className="flex size-9 items-center justify-center rounded-[2px] border-2 border-st-fg shadow-sm"
          style={{
            backgroundColor:
              index % 2 ? "var(--st-primary)" : "var(--st-fg)",
          }}
          aria-hidden
        >
          <Glyph size={18} style={{ color: "var(--st-primary-fg)" }} />
        </span>
        <span className="min-w-0 flex-1 rounded-[2px] border-2 border-st-fg bg-st-card px-3 py-1.5 shadow-sm">
          <span className="st-display block truncate text-[17px] text-st-fg font-black">
            {island.name}
          </span>
          <Mono className="block truncate text-st-muted-fg font-bold">
            {island.subtitle ||
              `${island.doneThrough}/6 levels · ${island.percentComplete}% complete`}
          </Mono>
        </span>
      </header>

      {!island.unlocked ? (
        <p className="px-4 pb-4 text-center relative z-20">
          <Mono className="rounded-[2px] border-2 border-st-fg bg-st-card px-3 py-1.5 text-st-muted-fg inline-block shadow-sm">
            {island.lockedReason}
          </Mono>
        </p>
      ) : (
        <div className="relative w-full overflow-hidden" style={{ height: totalHeight }}>
          {/* Continuous Winding SVG Road Trail Ribbon */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            viewBox={`0 0 350 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            {/* Outer Dirt Border */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#2c231c"
              strokeWidth="42"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main Road Surface */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#c78d4e"
              strokeWidth="34"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Sand Trail */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#e8c89b"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dashed Center Guide */}
            <path
              d={svgPathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeDasharray="8 8"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>

          {/* Environment Asset Decorations along the map */}
          {island.nodes.map((node, i) => {
            const pt = nodeCoords[i];
            const isLeft = Math.sin(i * 0.85) > 0;

            return (
              <div key={`dec-${i}`} className="absolute pointer-events-none z-10" style={{ left: pt.x, top: pt.y }}>
                {/* Trees & Nature elements flanking the road */}
                {i % 2 === 0 ? (
                  <img
                    src={`${MF_BASE}/tree-high.png`}
                    alt=""
                    className="absolute -top-10 h-16 w-16"
                    style={{ left: isLeft ? -110 : 50 }}
                  />
                ) : (
                  <img
                    src={`${MF_BASE}/tree.png`}
                    alt=""
                    className="absolute -top-8 h-14 w-14"
                    style={{ left: isLeft ? 50 : -100 }}
                  />
                )}

                {/* Rocks & Plants */}
                {i === 1 && (
                  <img
                    src={`${MF_BASE}/rocks-high.png`}
                    alt=""
                    className="absolute -top-4 -left-12 h-10 w-10 opacity-90"
                  />
                )}
                {i === 3 && (
                  <img
                    src={`${MF_BASE}/tent.png`}
                    alt=""
                    className="absolute -top-6 left-16 h-12 w-12"
                  />
                )}
                {i === 5 && (
                  <img
                    src={`${MF_BASE}/target.png`}
                    alt=""
                    className="absolute -top-4 -left-16 h-10 w-10"
                  />
                )}
                {node.isExam && (
                  <img
                    src={`${MF_BASE}/flag.png`}
                    alt=""
                    className="absolute -top-12 left-12 h-12 w-12"
                  />
                )}
              </div>
            );
          })}

          {/* Nodes Layer */}
          {island.nodes.map((node, i) => {
            const pt = nodeCoords[i];
            const isHere =
              here?.topicId === island.topicId && here.level === node.level;
            const active = node.status === "active";
            const done = node.status === "done";
            const locked = node.status === "locked";
            const size = node.isExam || active ? 64 : 52;
            const NodeGlyph = locked
              ? Lock
              : node.isExam
                ? Award
                : done
                  ? Check
                  : Star;

            const face = (
              <span
                className="flex items-center justify-center transition-transform active:scale-[0.94] shadow-lg relative rounded-full"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: active
                    ? "var(--st-primary)"
                    : done
                      ? "var(--st-card)"
                      : "var(--st-muted)",
                  borderWidth: active ? 4 : 3,
                  borderStyle: "solid",
                  borderColor: active
                    ? "var(--st-fg)"
                    : done
                      ? "var(--st-primary)"
                      : "var(--st-input)",
                  boxShadow: active
                    ? "0 0 12px rgba(199, 91, 57, 0.6), 2px 3px 0 #2c231c"
                    : "2px 3px 0 #2c231c",
                }}
              >
                <NodeGlyph
                  size={node.isExam || active ? 26 : 20}
                  aria-hidden
                  style={{
                    color: locked
                      ? "var(--st-muted-fg)"
                      : active
                        ? "var(--st-accent)"
                        : "var(--st-primary)",
                  }}
                />
              </span>
            );

            return (
              <div
                key={node.label}
                className="absolute flex flex-col items-center z-20"
                style={{
                  left: pt.x,
                  top: pt.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Node Interactive Element */}
                {locked ? (
                  <span aria-disabled>{face}</span>
                ) : (
                  <Link
                    href={
                      node.isExam
                        ? `/student/${studentId}/challenges?tab=exam`
                        : `/student/${studentId}/practice/${island.topicId}?level=${node.level}`
                    }
                    aria-label={`${island.name} — ${node.label}`}
                  >
                    {face}
                  </Link>
                )}

                {/* Node Text Pill with high contrast */}
                <Mono className="mt-1 font-black rounded-[2px] border-2 border-st-fg bg-st-card px-2 py-0.5 shadow-xs text-[10px]">
                  {node.label}
                </Mono>

                {/* "You are here" marker with Kenney toon character explorer & Peeps avatar */}
                {isHere ? (
                  <div className="absolute left-10 top-0 flex items-center gap-1.5 rounded-[2px] border-2 border-st-fg bg-st-card p-1.5 shadow-md z-30 min-w-[100px]">
                    <img
                      src="/kenney/toon-characters/Female adventurer/PNG/Poses/character_femaleAdventurer_walk0.png"
                      alt=""
                      className="h-9 w-7 shrink-0 object-contain"
                    />
                    <div className="flex flex-col items-center">
                      <StudentAvatar
                        seed={seed}
                        overrides={overrides}
                        size={22}
                        shape="square"
                        ring="var(--st-fg)"
                        ringWidth={1}
                        background="var(--st-peach)"
                      />
                      <Mono className="mt-0.5 text-center text-[7px] font-black leading-tight text-st-primary uppercase">
                        You Are Here
                      </Mono>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Tile>
  );
}
