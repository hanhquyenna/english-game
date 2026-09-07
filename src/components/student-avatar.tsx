"use client";

import { npcSrc, type NpcCharacter } from "@/components/student/kenney-story-dialog";
import { cn } from "@/lib/utils";

export type EquippedItem = {
  id: string;
  label?: string;
  icon: string;
  slot: "hat" | "badge";
  color?: string;
};

const CHARACTERS: NpcCharacter[] = [
  "Female adventurer",
  "Female person",
  "Male adventurer",
  "Male person",
];

function getCharacterForSeed(seed: string): NpcCharacter {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CHARACTERS.length;
  return CHARACTERS[idx];
}

/**
 * Main student avatar component — renders Kenney Toon Characters.
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
  background = "var(--persona-soft)",
  shape = "circle",
  label,
  labelColor,
  className,
  title,
  pose = "idle",
  noFrame = false,
}: {
  seed: string;
  overrides?: any;
  size?: number;
  variant?: "bust" | "full";
  items?: any[];
  ring?: string | null;
  ringWidth?: number;
  glow?: string;
  background?: string | null;
  shape?: "circle" | "square";
  label?: string | null;
  labelColor?: string;
  className?: string;
  title?: string;
  pose?: string;
  noFrame?: boolean;
}) {
  const character: NpcCharacter =
    overrides?.character && CHARACTERS.includes(overrides.character as NpcCharacter)
      ? (overrides.character as NpcCharacter)
      : getCharacterForSeed(seed || "default-student");

  const characterSrc = npcSrc(pose, character);

  const width = size;
  const height = size;

  const hats = items.filter((i) => i.slot === "hat");
  const badges = items.filter((i) => i.slot === "badge");

  return (
    <span
      className={cn("relative inline-block shrink-0 align-middle", className)}
      style={{ width, height }}
      title={title || character}
    >
      <span
        className="block size-full overflow-hidden flex items-center justify-center relative p-0"
        style={{
          borderRadius: noFrame ? 0 : shape === "square" ? 4 : "50%",
          background: noFrame ? "transparent" : (background ?? "var(--persona-soft)"),
          border: noFrame ? "none" : (ring ? `${ringWidth}px solid ${ring}` : "2px solid var(--persona-border)"),
          boxShadow: noFrame ? "none" : (glow ? glow : "2px 2px 0 var(--persona-border)"),
        }}
      >
        <img
          src={characterSrc}
          alt={character}
          className="h-full w-full object-contain"
        />
      </span>

      {hats.map((item) => (
        <img
          key={item.icon}
          src={`/assets/items/${item.icon}.svg`}
          alt={item.label ?? ""}
          aria-hidden={!item.label}
          className="pointer-events-none absolute z-10"
          style={{
            width: width * 0.5,
            height: width * 0.5,
            left: "50%",
            top: "-15%",
            transform: "translateX(-50%) rotate(-8deg)",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))",
          }}
        />
      ))}

      {badges.length > 0 ? (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 z-10"
          style={{ width: width * 0.4, height: width * 0.4 }}
        >
          <img
            src={`/assets/items/${badges[0].icon}.svg`}
            alt={badges[0].label ?? ""}
            aria-hidden={!badges[0].label}
            style={{
              width: "70%",
              height: "70%",
            }}
          />
        </span>
      ) : null}

      {label ? (
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-black leading-tight text-white shadow-sm z-10 uppercase"
          style={{ backgroundColor: labelColor ?? ring ?? "var(--primary)" }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
