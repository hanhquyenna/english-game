"use client";

import Peep from "react-peeps";
import {
  ASPECT,
  INK,
  peepWithOverrides,
  VIEWBOX,
  type EquippedItem,
  type PeepConfig,
} from "@/lib/peeps";
import { cn } from "@/lib/utils";

export type { EquippedItem };

/**
 * THE avatar component.
 *
 * Every character rendering in the product goes through here — home header,
 * avatar picker, shop preview and swatches, leaderboard rows and podium,
 * profile, teacher roster, parent screens. One component means one identity:
 * the same seed always produces the same person, so a student recognises
 * themselves everywhere instead of meeting a different mascot per screen.
 *
 * Characters are Open Peeps (Pablo Stanley, CC0) via `react-peeps` (MIT).
 * Items layered on top come from `public/assets/items` — see ATTRIBUTION.md.
 *
 * Note: react-peeps calls a hook, so this is a client component. Colours are
 * always plain strings, never gradient objects, because the library derives
 * gradient ids from Math.random() and that would break SSR hydration.
 */

export function StudentAvatar({
  seed,
  overrides,
  size = 48,
  variant = "bust",
  items = [],
  ring,
  ringWidth = 3,
  glow,
  background = "#f4f1ff",
  label,
  labelColor,
  className,
  title,
}: {
  /** Fixed identity. Never regenerate this for an existing student. */
  seed: string;
  /** Customisations the student has chosen in the shop. */
  overrides?: Partial<PeepConfig> | null;
  size?: number;
  variant?: "bust" | "full";
  items?: EquippedItem[];
  ring?: string | null;
  ringWidth?: number;
  glow?: string;
  background?: string | null;
  /** Small pill under the character, e.g. the CEFR band. */
  label?: string | null;
  labelColor?: string;
  className?: string;
  title?: string;
}) {
  const peep = peepWithOverrides(seed, overrides);
  const isFull = variant === "full";

  const hats = items.filter((i) => i.slot === "hat");
  const badges = items.filter((i) => i.slot === "badge");

  // `size` is the height; a full-body figure is narrower than it is tall.
  const width = size * ASPECT[variant];
  const height = size;

  return (
    <span
      className={cn("relative inline-block shrink-0 align-middle", className)}
      style={{ width, height }}
      title={title}
    >
      <span
        className="block size-full overflow-hidden"
        style={{
          borderRadius: isFull ? 16 : "50%",
          background: background ?? undefined,
          boxShadow: ring
            ? `0 0 0 ${ringWidth}px ${ring}${glow ? `, ${glow}` : ""}`
            : glow,
        }}
      >
        <Peep
          style={{ width: "100%", height: "100%", display: "block" }}
          viewBox={isFull ? VIEWBOX.full : VIEWBOX.bust}
          hair={peep.hair}
          face={peep.face}
          body={isFull ? peep.stand : peep.body}
          accessory={peep.accessory}
          // backgroundColor fills the skin; strokeColor is the ink.
          strokeColor={INK}
          backgroundColor={peep.skin}
        />
      </span>

      {hats.map((item) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.icon}
          src={`/assets/items/${item.icon}.svg`}
          alt={item.label ?? ""}
          aria-hidden={!item.label}
          className="pointer-events-none absolute"
          style={{
            width: width * 0.58,
            height: width * 0.58,
            left: "50%",
            top: isFull ? "-2%" : "-15%",
            transform: "translateX(-50%) rotate(-8deg)",
            color: item.color ?? "#ffd54a",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))",
          }}
        />
      ))}

      {badges.length > 0 ? (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
          style={{ width: width * 0.4, height: width * 0.4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/items/${badges[0].icon}.svg`}
            alt={badges[0].label ?? ""}
            aria-hidden={!badges[0].label}
            style={{
              width: "70%",
              height: "70%",
              color: badges[0].color ?? "#534ab7",
            }}
          />
        </span>
      ) : null}

      {label ? (
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[10px] font-bold leading-tight text-white shadow-sm"
          style={{ backgroundColor: labelColor ?? ring ?? "var(--persona)" }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
