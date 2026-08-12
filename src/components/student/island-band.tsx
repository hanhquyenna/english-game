import Link from "next/link";
import { Award, Check, Lock, Map, Star, Triangle } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { Mono, Tile } from "@/components/student/ui";
import type { Island } from "@/lib/islands";
import type { PeepConfig } from "@/lib/peeps";

/**
 * One island tile on the Learn path, ported from the prototype's PathScreen.
 *
 * `styles.island`: 14px side margin, 20px top, 16/25 padding, tinted card on
 * the standard tile border + shadow. Nodes sit in a 13px-gap column, each row
 * 73px tall, offset horizontally by sin(index * 0.85) * 38 to make the path
 * wind. Active and exam nodes are 68px, the rest 54px; exam nodes use a 14px
 * radius instead of a circle.
 */

const ISLAND_ICONS = [Map, Triangle, Award];

/** `colors.peach | mint | secondary | lavender` cycle from ISLANDS. */
const ISLAND_TINTS = [
  "var(--st-peach)",
  "var(--st-mint)",
  "var(--st-secondary)",
  "var(--st-lavender)",
];

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

  return (
    <Tile
      className="mx-[14px] mt-5 overflow-hidden pb-[25px] pt-4"
      style={{ backgroundColor: ISLAND_TINTS[index % ISLAND_TINTS.length] }}
    >
      <header className="flex items-center gap-2.5 px-4 pb-[18px]">
        <span
          className="flex size-8 items-center justify-center rounded-[2px]"
          style={{
            backgroundColor:
              index % 2 ? "var(--st-primary)" : "var(--st-fg)",
          }}
          aria-hidden
        >
          <Glyph size={17} style={{ color: "var(--st-primary-fg)" }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="st-display block truncate text-[17px] text-st-fg">
            {island.name}
          </span>
          <Mono className="block truncate text-st-muted-fg">
            {island.subtitle ||
              `${island.doneThrough}/6 levels · ${island.percentComplete}% complete`}
          </Mono>
        </span>
      </header>

      {!island.unlocked ? (
        <p className="px-4 pb-2 text-center">
          <Mono className="text-st-muted-fg">{island.lockedReason}</Mono>
        </p>
      ) : (
        <ol className="flex flex-col items-center gap-[13px]">
          {island.nodes.map((node, i) => {
            const isHere =
              here?.topicId === island.topicId && here.level === node.level;
            const active = node.status === "active";
            const done = node.status === "done";
            const locked = node.status === "locked";
            const size = node.isExam || active ? 68 : 54;
            const NodeGlyph = locked
              ? Lock
              : node.isExam
                ? Award
                : done
                  ? Check
                  : Star;

            const face = (
              <span
                className="flex items-center justify-center transition-transform active:scale-[0.94]"
                style={{
                  width: size,
                  height: size,
                  borderRadius: node.isExam ? 14 : size / 2,
                  backgroundColor: active
                    ? "var(--st-primary)"
                    : done
                      ? "var(--st-card)"
                      : "var(--st-muted)",
                  borderWidth: active ? 4 : 2,
                  borderStyle: "solid",
                  borderColor: active
                    ? "var(--st-fg)"
                    : done
                      ? "var(--st-primary)"
                      : "var(--st-input)",
                }}
              >
                <NodeGlyph
                  size={node.isExam || active ? 27 : 21}
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
              <li
                key={node.label}
                className="relative flex min-h-[73px] flex-col items-center"
                style={{ transform: `translateX(${Math.sin(i * 0.85) * 38}px)` }}
              >
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

                <Mono
                  className="mt-1 font-extrabold"
                  style={{
                    color: locked ? "var(--st-muted-fg)" : "var(--st-fg)",
                  }}
                >
                  {node.label}
                </Mono>

                {isHere ? (
                  <span className="absolute left-[72px] top-[5px] flex w-[74px] flex-col items-center">
                    <StudentAvatar
                      seed={seed}
                      overrides={overrides}
                      size={30}
                      shape="square"
                      ring="var(--st-fg)"
                      ringWidth={2}
                      background="var(--st-card)"
                    />
                    <Mono className="mt-0.5 text-center font-extrabold text-st-primary">
                      You are here
                    </Mono>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Tile>
  );
}
