import {
  contribution,
  INPUT_LABELS,
  LEVEL_WEIGHTS,
  weakestInput,
  type LevelBreakdown,
  type LevelInputKey,
} from "@/lib/level-engine";
import { cn } from "@/lib/utils";

const ORDER: LevelInputKey[] = [
  "hours",
  "vocab",
  "exam",
  "coverage",
  "grammar",
];

function scoreFor(level: LevelBreakdown, key: LevelInputKey): number {
  return {
    hours: level.hoursScore,
    vocab: level.vocabScore,
    exam: level.examScore,
    coverage: level.coverageScore,
    grammar: level.grammarScore,
  }[key];
}

/**
 * The five-part explanation of the level — "why is my child at this level" is
 * a feature, not an implementation detail (§2). Weights are shown on screen
 * on purpose: the number is meant to be auditable, not taken on trust.
 */
export function LevelBreakdownList({
  level,
  raw,
  className,
  highlightWeakest = true,
}: {
  level: LevelBreakdown;
  /** Optional plain-language counts behind each score, e.g. "6/16 từ". */
  raw?: Partial<Record<LevelInputKey, string>>;
  className?: string;
  highlightWeakest?: boolean;
}) {
  const weakest = weakestInput(level);

  return (
    <ul className={cn("space-y-3", className)}>
      {ORDER.map((key) => {
        const score = scoreFor(level, key);
        const isWeakest = highlightWeakest && key === weakest.key;

        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                {INPUT_LABELS[key].vi}
                <span className="text-xs font-normal text-muted-foreground">
                  ({Math.round(LEVEL_WEIGHTS[key] * 100)}%)
                </span>
                {isWeakest ? (
                  <span
                    className="rounded-full px-1.5 py-px text-[10px] font-semibold"
                    style={{
                      backgroundColor: "var(--persona-soft)",
                      color: "var(--persona)",
                    }}
                  >
                    yếu nhất
                  </span>
                ) : null}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {raw?.[key] ? (
                  <span className="mr-2 text-xs">{raw[key]}</span>
                ) : null}
                <span className="font-semibold text-foreground">{score}</span>
                <span className="text-xs">
                  {" "}
                  → +{contribution(level, key)} điểm
                </span>
              </span>
            </div>

            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/8">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(1, score)}%`,
                  backgroundColor: isWeakest
                    ? "var(--warning)"
                    : "var(--persona)",
                  opacity: isWeakest ? 1 : 0.75,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** The one-line "what would move this" nudge (§6). */
export function WeakestHint({ level }: { level: LevelBreakdown }) {
  const weakest = weakestInput(level);
  return (
    <p className="text-sm">
      <span className="font-semibold">Cách lên trình độ nhanh nhất: </span>
      <span className="text-muted-foreground">{weakest.label.hint}</span>
    </p>
  );
}
