"use client";

import * as React from "react";
import { Tile } from "@/components/student/ui";

/**
 * NPC character path helper — resolves to a Kenney toon-characters pose image.
 *
 * Default character: Female adventurer (warm/approachable for kids).
 * Pose mapping: talk → intro, cheer0 → correct/success, hurt → wrong/error,
 *               think → question/confirmation, idle → neutral.
 */
const NPC_BASE = "/kenney/toon-characters";

type NpcCharacter =
  | "Female adventurer"
  | "Female person"
  | "Male adventurer"
  | "Male person"
  | "Robot"
  | "Zombie";

function npcSrc(
  pose: string,
  character: NpcCharacter = "Female adventurer",
): string {
  const charKey =
    character === "Female adventurer"
      ? "femaleAdventurer"
      : character === "Female person"
        ? "femalePerson"
        : character === "Male adventurer"
          ? "maleAdventurer"
          : character === "Male person"
            ? "malePerson"
            : character === "Robot"
              ? "robot"
              : "zombie";
  return `${NPC_BASE}/${character}/PNG/Poses/character_${charKey}_${pose}.png`;
}

export { npcSrc };
export type { NpcCharacter };

interface KenneyStoryDialogProps {
  /** Pose name from Kenney toon-characters (e.g. "talk", "cheer0", "hurt", "think", "idle") */
  npcPose: string;
  /** Which Kenney character to use. Default: "Female adventurer" */
  npcCharacter?: NpcCharacter;
  /** Dialog title */
  title: string;
  /** Dialog body text or ReactNode */
  body: React.ReactNode;
  /** Primary CTA button label */
  ctaLabel?: string;
  /** Primary CTA click handler */
  onCta?: () => void;
  /** Optional secondary button label */
  secondaryLabel?: string;
  /** Optional secondary button click handler */
  onSecondary?: () => void;
  /** Visual variant: "inline" renders in flow, "overlay" renders as a fixed modal overlay */
  variant?: "inline" | "overlay";
  /** Additional content rendered below body, above buttons (e.g. reward badges) */
  children?: React.ReactNode;
}

/**
 * Shared NPC story/feedback dialog used across Role Play, Practice, and Library.
 *
 * Renders a Kenney toon-character NPC image alongside a speech-bubble dialog
 * using the standard `Tile` + `st-*` design tokens. Supports both inline
 * (in-flow) and overlay (modal) variants.
 *
 * Usage examples:
 * - Role Play intro card: pose="talk", variant="inline"
 * - Correct answer feedback: pose="cheer0", variant="inline"
 * - Wrong answer feedback: pose="hurt", variant="inline"
 * - Completion celebration: pose="cheer0", variant="overlay"
 * - Exit confirmation: pose="think", variant="overlay"
 * - Empty mistake bank: pose="cheer0", variant="inline"
 */
export function KenneyStoryDialog({
  npcPose,
  npcCharacter = "Female adventurer",
  title,
  body,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
  variant = "inline",
  children,
}: KenneyStoryDialogProps) {
  const imgSrc = npcSrc(npcPose, npcCharacter);

  const dialogContent = (
    <Tile className="w-full max-w-sm bg-st-card p-5 text-center">
      {/* NPC Character Image */}
      <div className="mb-3 flex justify-center">
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2px] border-2 border-st-fg bg-st-peach">
          <img
            src={imgSrc}
            alt="NPC guide"
            className="h-full w-full object-contain"
            style={{ imageRendering: "auto" }}
            onError={(e) => {
              // Fallback: hide broken image, show a placeholder bg
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Dialog Text */}
      <h3 className="st-display text-[20px] text-st-fg">{title}</h3>
      <div className="mt-1 text-[13px] text-st-muted-fg">{body}</div>

      {/* Optional extra content (rewards, stats, etc.) */}
      {children}

      {/* Action Buttons */}
      {(ctaLabel || secondaryLabel) && (
        <div className="mt-4 flex gap-2">
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="st-mono flex-1 rounded-[2px] border-2 border-st-fg bg-st-bg py-2.5 font-black uppercase text-st-fg transition-opacity active:opacity-70"
            >
              {secondaryLabel}
            </button>
          )}
          {ctaLabel && onCta && (
            <button
              onClick={onCta}
              className="st-mono flex-1 rounded-[2px] border-2 border-st-fg py-2.5 font-black uppercase transition-opacity active:opacity-70"
              style={{
                backgroundColor: "var(--st-primary)",
                color: "var(--st-primary-fg)",
              }}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      )}
    </Tile>
  );

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-st-fg/60 p-4">
        {dialogContent}
      </div>
    );
  }

  return dialogContent;
}
