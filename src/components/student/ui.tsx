import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Student-app primitives, ported 1:1 from the UX deep-dive prototype's
 * StyleSheet (artifacts/student-learning-app/app/index.tsx).
 *
 * Numbers here are the prototype's numbers — border widths, paddings, font
 * sizes and gaps are copied rather than approximated, so screens built from
 * these read as the design rather than merely like it.
 */

/** `styles.tile` — 2px border, radius 2, hard 3px offset shadow, no blur. */
export function Tile({
  className,
  style,
  children,
  ...rest
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("st-tile", className)} style={style} {...rest}>
      {children}
    </div>
  );
}

/** `styles.mono` — 10px uppercase-ish monospace micro-label. */
export function Mono({
  className,
  children,
  ...rest
}: React.ComponentProps<"span">) {
  return (
    <span className={cn("st-mono", className)} {...rest}>
      {children}
    </span>
  );
}

/** `styles.pageTitle` — Georgia 29/900, tight tracking. */
export function PageTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h1
      className={cn(
        "st-display text-[29px] leading-tight tracking-[-0.4px] text-st-fg",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/** `styles.pageTitleSmall` — used beside a back arrow. */
export function PageTitleSmall({ children }: { children: React.ReactNode }) {
  return (
    <span className="st-display ml-2 text-[20px] text-st-fg">{children}</span>
  );
}

/** `styles.pageIntro` — 13/20 muted lead paragraph. */
export function PageIntro({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[18px] mt-[7px] text-[13px] leading-[20px] text-st-muted-fg">
      {children}
    </p>
  );
}

/** `styles.sectionLabel` — 10px mono, letter-spacing 1, uppercase. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="st-mono mb-[9px] mt-[22px] font-black uppercase tracking-[1px] text-st-muted-fg">
      {children}
    </p>
  );
}

/** `styles.status` — the DONE / PENDING / UPCOMING chip on Challenges. */
export function StatusChip({
  status,
}: {
  status: "DONE" | "PENDING" | "UPCOMING";
}) {
  const done = status === "DONE";
  return (
    <span
      className="st-mono shrink-0 px-2 py-[5px] font-black"
      style={{
        backgroundColor: done ? "var(--st-mint)" : "var(--st-peach)",
        color: done ? "var(--st-fg)" : "var(--st-primary)",
      }}
    >
      {status}
    </span>
  );
}

/** `styles.progressTrack` / `progressFill` — 8px bar, radius 2. */
export function ProgressTrack({
  percent,
  trackColor = "var(--st-muted)",
  fillColor = "var(--st-primary)",
  className,
}: {
  percent: number;
  trackColor?: string;
  fillColor?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-[2px]", className)}
      style={{ backgroundColor: trackColor }}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-[2px] transition-[width] duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, percent))}%`,
          backgroundColor: fillColor,
        }}
      />
    </div>
  );
}

/**
 * `styles.footerButtonText` on a filled block — the prototype's primary CTA.
 * Uppercase mono, letter-spacing 0.6.
 */
export function BlockButton({
  children,
  className,
  tone = "primary",
  ...rest
}: React.ComponentProps<"button"> & {
  tone?: "primary" | "accent" | "muted" | "destructive";
}) {
  const tones = {
    primary: { bg: "var(--st-primary)", fg: "var(--st-primary-fg)" },
    accent: { bg: "var(--st-accent)", fg: "var(--st-fg)" },
    muted: { bg: "var(--st-muted)", fg: "var(--st-muted-fg)" },
    destructive: { bg: "var(--st-destructive)", fg: "var(--st-primary-fg)" },
  }[tone];

  return (
    <button
      className={cn(
        "st-mono flex min-h-[52px] items-center justify-center gap-[9px] rounded-[2px] px-[18px]",
        "text-[12px] font-black uppercase tracking-[0.6px] transition-opacity",
        "active:opacity-70 disabled:opacity-100",
        className,
      )}
      style={{ backgroundColor: tones.bg, color: tones.fg }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** `styles.outlineButton` — 2px outlined, 50px tall. */
export function OutlineButton({
  children,
  className,
  ...rest
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "st-mono mt-[19px] flex min-h-[50px] w-full items-center justify-center gap-2",
        "rounded-[2px] border-2 border-st-fg text-[12px] font-black uppercase",
        "tracking-[0.6px] text-st-primary transition-opacity active:opacity-70",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
