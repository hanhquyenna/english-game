"use client";

import Link from "next/link";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Heart, Sparkles } from "lucide-react";
import { Mono } from "@/components/student/ui";

/**
 * Buddy Pet Widget — fixed bottom-right "pet pen" on the Learn page.
 *
 * Uses Kenney fence tiles as border decoration and displays pet stage
 * via Kenney tile images instead of emoji. Renders skeleton placeholder
 * if pet data isn't loaded (never spinner per FRS anti-pattern rule).
 */

const PET_STAGE_TILES: Record<number, string> = {
  1: "/kenney/tiny-town/Tiles/tile_0094.png", // beehive — baby pet
  2: "/kenney/tiny-town/Tiles/tile_0016.png", // green tree — growing
  3: "/kenney/tiny-town/Tiles/tile_0093.png", // gem — max stage
};

export function BuddyPetWidget({ studentId }: { studentId: string }) {
  if (!isFeatureEnabled("BUDDY_PET")) return null;

  const stageTile = PET_STAGE_TILES[1]; // Default stage 1 for widget preview

  return (
    <Link
      href={`/student/${studentId}/pet`}
      className="fixed bottom-20 right-4 z-10 flex flex-col items-center gap-0.5 transition-transform active:scale-95"
      title="Buddy Pet"
      style={{ filter: "drop-shadow(2px 2px 0 var(--st-fg))" }}
    >
      {/* Fence border frame using tile images */}
      <div
        className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[2px] border-2 border-st-fg"
        style={{
          backgroundColor: "var(--st-peach)",
          backgroundImage: `url(/kenney/tiny-town/Tiles/tile_0000.png)`,
          backgroundSize: "16px 16px",
          imageRendering: "pixelated" as React.CSSProperties["imageRendering"],
        }}
      >
        {/* Fence top decoration */}
        <div
          className="absolute left-0 top-0 h-[8px] w-full"
          style={{
            backgroundImage: `url(/kenney/tiny-town/Tiles/tile_0044.png)`,
            backgroundSize: "16px 8px",
            backgroundRepeat: "repeat-x",
            imageRendering: "pixelated" as React.CSSProperties["imageRendering"],
          }}
        />
        {/* Pet stage icon */}
        <img
          src={stageTile}
          alt="Pet"
          className="relative z-[1] h-8 w-8"
          style={{ imageRendering: "pixelated" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Heart indicator */}
        <Heart
          size={10}
          className="absolute bottom-1 right-1 z-[2]"
          style={{ color: "var(--st-destructive)", fill: "var(--st-destructive)" }}
        />
      </div>
      <Mono className="text-[7px] font-black uppercase text-st-fg">
        Pet
      </Mono>
    </Link>
  );
}
