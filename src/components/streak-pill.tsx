import { AlertTriangle, Flame, HeartCrack, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreakState } from "@/lib/progression";

const COPY: Record<
  StreakState,
  { label: string; icon: LucideIcon; tone: string }
> = {
  ACTIVE_TODAY: {
    label: "đã học hôm nay",
    icon: Flame,
    tone: "bg-[var(--success)]/12 text-[var(--success)]",
  },
  AT_RISK: {
    label: "chưa học hôm nay",
    icon: AlertTriangle,
    tone: "bg-[var(--warning)]/16 text-[color-mix(in_oklab,var(--warning)_75%,black)]",
  },
  BROKEN: {
    label: "đã mất streak",
    icon: HeartCrack,
    tone: "bg-[var(--danger)]/10 text-[var(--danger)]",
  },
};

export function StreakPill({
  streak,
  state,
  className,
}: {
  streak: number;
  state: StreakState;
  className?: string;
}) {
  const copy = COPY[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        copy.tone,
        className,
      )}
    >
      <copy.icon size={13} aria-hidden />
      <span className="font-bold tabular-nums">{streak}</span>
      <span className="font-normal opacity-80">ngày</span>
      <span className="sr-only">, {copy.label}</span>
    </span>
  );
}
