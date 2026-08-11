import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";
import { cn } from "@/lib/utils";

/**
 * The student's creature (§13).
 *
 * Two progression layers sit on one fixed identity:
 *   - the base creature comes from a DiceBear seed set once and never changed,
 *   - the rank frame follows LevelScore.cefrBand (rare, meaningful),
 *   - accessories layer on top from streak/XP milestones (frequent, small).
 *
 * Rendered locally from the npm package rather than DiceBear's HTTP API, so
 * the app has no external image dependency at runtime.
 *
 * Bottts style by Pablo Stanley (bottts.com), free for personal and
 * commercial use — credited in the README.
 */
export function AvatarCreature({
  seed,
  size = 64,
  frameColor,
  band,
  accessories = [],
  className,
}: {
  seed: string;
  size?: number;
  frameColor?: string | null;
  band?: string | null;
  accessories?: string[];
  className?: string;
}) {
  const uri = createAvatar(bottts, {
    seed,
    size: 128,
    radius: 50,
    backgroundColor: ["transparent"],
  }).toDataUri();

  const ring = frameColor ?? "var(--persona)";

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="size-full rounded-full bg-white"
        style={{ boxShadow: `0 0 0 3px ${ring}, 0 0 0 6px ${ring}22` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uri}
          alt=""
          width={size}
          height={size}
          className="size-full rounded-full"
        />
      </div>

      {band ? (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[10px] font-bold leading-tight text-white shadow-sm"
          style={{ backgroundColor: ring }}
        >
          {band}
        </span>
      ) : null}

      {accessories.length > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex items-center rounded-full bg-white px-1 shadow-sm ring-1 ring-black/5"
          style={{ fontSize: Math.max(11, size * 0.24) }}
          aria-hidden
        >
          {accessories.slice(0, 2).join("")}
        </span>
      ) : null}
    </div>
  );
}
