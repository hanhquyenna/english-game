"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gradeSubmission } from "@/lib/actions/teacher";

/**
 * §7 step 6. Two real grading paths: auto-score the stored answers against the
 * exercises' correct answers, or enter a mark by hand. Either way the score is
 * written, grammar mastery for the topic is raised, and the Level Engine
 * recomputes — which is what the student and parent tabs are watching for.
 */
export function GradeRow({
  submissionId,
  studentName,
  score,
  canAutoScore,
}: {
  submissionId: string;
  studentName: string;
  score: number | null;
  canAutoScore: boolean;
}) {
  const [manual, setManual] = useState("");
  const [pending, start] = useTransition();

  function submit(manualScore?: number) {
    start(async () => {
      try {
        const r = await gradeSubmission(submissionId, manualScore);
        toast.success(
          `${studentName}: ${r.score}/100 — trình độ giờ là ${r.breakdown.cefrBand} (${r.breakdown.compositeScore})`,
        );
        setManual("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không chấm được");
      }
    });
  }

  const parsed = Number(manual);
  const manualValid = manual !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5">
      <span className="min-w-24 flex-1 font-medium">{studentName}</span>

      {score === null ? (
        <span className="rounded-full bg-[var(--warning)]/16 px-2 py-0.5 text-xs font-medium text-[color-mix(in_oklab,var(--warning)_75%,black)]">
          Chờ chấm
        </span>
      ) : (
        <span className="rounded-full bg-[var(--success)]/12 px-2 py-0.5 text-xs font-medium text-[var(--success)]">
          {score}/100
        </span>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Điểm"
          inputMode="numeric"
          aria-label={`Nhập điểm cho ${studentName}`}
          className="h-8 w-20"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !manualValid}
          onClick={() => submit(parsed)}
        >
          Lưu điểm
        </Button>
        {canAutoScore ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => submit(undefined)}
            title="Tự chấm dựa trên đáp án học sinh đã chọn"
          >
            {pending ? "…" : score === null ? "Tự chấm" : "Chấm lại"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
