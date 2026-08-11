import { cn } from "@/lib/utils";
import type { LevelBreakdown } from "@/lib/level-engine";

/**
 * The CEFR band and progress toward the next one — the single number the whole
 * product is built around. Rendered identically for every persona so the
 * teacher, student and parent are visibly looking at the same thing.
 */
export function LevelBar({
  level,
  size = "md",
  className,
  flash = false,
}: {
  level: LevelBreakdown;
  size?: "sm" | "md" | "lg";
  className?: string;
  flash?: boolean;
}) {
  const heights = { sm: "h-2", md: "h-3", lg: "h-4" } as const;
  const bandText = { sm: "text-lg", md: "text-2xl", lg: "text-4xl" } as const;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn("font-bold leading-none", bandText[size])}
            style={{ color: "var(--persona)" }}
          >
            {level.cefrBand}
          </span>
          <span className="text-sm text-muted-foreground">
            {level.compositeScore}/100
          </span>
        </div>
        {level.nextBand ? (
          <span className="text-xs text-muted-foreground">
            {level.progressToNextBand}% tới{" "}
            <span className="font-semibold">{level.nextBand}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Cấp cao nhất</span>
        )}
      </div>

      <div
        className={cn(
          "mt-2 w-full overflow-hidden rounded-full bg-black/8",
          heights[size],
          flash && "animate-flash",
        )}
        role="progressbar"
        aria-valuenow={level.progressToNextBand}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Tiến độ tới trình độ ${level.nextBand ?? level.cefrBand}`}
      >
        <div
          className={cn(
            "level-bar-fill h-full rounded-full transition-[width] duration-700 ease-out",
          )}
          style={{ width: `${Math.max(2, level.progressToNextBand)}%` }}
        />
      </div>
    </div>
  );
}
