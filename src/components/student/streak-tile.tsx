"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";

/**
 * `styles.notification` — the accent-filled reminder tile on Challenges,
 * dismissible via the corner (X) icon.
 *
 * The page only renders this when the student genuinely has not practised
 * today, so it never fires falsely.
 */
export function StreakTile() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Tile
      className="mb-4 flex gap-2.5 p-[13px]"
      style={{ backgroundColor: "var(--st-accent)" }}
    >
      <span className="flex-1">
        <span className="st-display mb-1 block text-[15px] text-st-fg">
          Streak reminder
        </span>
        <Mono className="block text-st-fg">
          You&rsquo;ll lose your streak tonight — finish a quick review.
        </Mono>
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss reminder"
        className="shrink-0 self-start transition-opacity active:opacity-70"
      >
        <X size={17} style={{ color: "var(--st-fg)" }} aria-hidden />
      </button>
    </Tile>
  );
}
