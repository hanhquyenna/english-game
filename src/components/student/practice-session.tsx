"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAnswerCorrect, type Question } from "@/lib/practice";
import { completePracticeRound, recordAttempt } from "@/lib/actions/student";
import type { LevelBreakdown } from "@/lib/level-engine";
import { LevelBar } from "@/components/level-bar";
import { JournalPrompt } from "@/components/student/journal-prompt";
import { cn } from "@/lib/utils";

type Answer = number | string | Record<string, string>;

/**
 * The practice loop (§6 student 2): one question at a time, a progress bar, and
 * instant right/wrong feedback.
 *
 * Each answer is written the moment it is given rather than batched at the end,
 * so a parent watching the other tab sees today's activity and streak move
 * while their child is still practising (§7 step 5).
 */
export function PracticeSession({
  studentId,
  topicId,
  topicTitle,
  questions,
  startingPercent,
}: {
  studentId: string;
  topicId: string;
  topicTitle: string;
  questions: Question[];
  startingPercent: number;
}) {
  const router = useRouter();

  // Held in state so a realtime-triggered refresh cannot reshuffle the round
  // out from under the student mid-session.
  const [round] = useState(questions);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState<null | { correct: boolean }>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [level, setLevel] = useState<LevelBreakdown | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState<{ label: string; emoji: string }[]>([]);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const startedAt = useMemo(() => Date.now(), []);
  const question = round[index];
  const progress = Math.round((index / round.length) * 100);

  function check() {
    if (answer === null || checked) return;
    const correct = isAnswerCorrect(question, answer);
    setChecked({ correct });
    if (correct) setCorrectCount((c) => c + 1);

    start(async () => {
      try {
        const result = await recordAttempt({
          studentId,
          exerciseId: question.id,
          correct,
        });
        setLevel(result.breakdown);
        setStreak(result.streak);
        setXpEarned((x) => x + (correct ? 10 : 2));
        if (result.unlocked.length) {
          setUnlocked((u) => [...u, ...result.unlocked]);
          for (const item of result.unlocked) {
            toast.success(`New item unlocked: ${item.label}`);
          }
        }
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not save your answer",
        );
      }
    });
  }

  function next() {
    if (index + 1 >= round.length) {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      start(async () => {
        await completePracticeRound(studentId, minutes);
        setDone(true);
        router.refresh();
      });
      return;
    }
    setIndex((i) => i + 1);
    setAnswer(null);
    setChecked(null);
  }

  if (done) {
    return (
      <SessionComplete
        studentId={studentId}
        topicId={topicId}
        topicTitle={topicTitle}
        correctCount={correctCount}
        total={round.length}
        xpEarned={xpEarned}
        level={level}
        streak={streak}
        unlocked={unlocked}
        startingPercent={startingPercent}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/student/${studentId}`}
          className="text-xl text-muted-foreground hover:text-foreground"
          aria-label="Exit practice"
        >
          ✕
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/10">
          <div
            className="level-bar-fill h-full rounded-full transition-[width] duration-300"
            style={{ width: `${Math.max(3, progress)}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {index + 1}/{round.length}
        </span>
      </div>

      <p className="mb-1 text-sm font-medium text-muted-foreground">
        {question.instruction}
      </p>

      <div key={question.id} className="animate-rise">
        {question.kind === "CHOICE" ? (
          <ChoiceQuestion
            question={question}
            answer={answer as number | null}
            checked={checked}
            onAnswer={setAnswer}
          />
        ) : question.kind === "INPUT" ? (
          <InputQuestion
            question={question}
            answer={(answer as string) ?? ""}
            checked={checked}
            onAnswer={setAnswer}
            onSubmit={check}
          />
        ) : (
          <MatchQuestion
            question={question}
            answer={(answer as Record<string, string>) ?? {}}
            checked={checked}
            onAnswer={setAnswer}
          />
        )}
      </div>

      {checked ? (
        <div
          className={cn(
            "animate-pop mt-5 rounded-xl p-4",
            checked.correct
              ? "bg-[var(--success)]/12 text-[var(--success)]"
              : "bg-[var(--danger)]/10 text-[var(--danger)]",
          )}
        >
          <p className="font-bold">
            {checked.correct ? "🎉 Excellent!" : "Not quite"}
          </p>
          {!checked.correct ? (
            <p className="mt-1 text-sm text-foreground">
              Correct answer:{" "}
              <span className="font-semibold">
                {question.kind === "CHOICE"
                  ? question.options[question.answerIndex]
                  : question.kind === "INPUT"
                    ? question.answer
                    : question.pairs
                        .map((p) => `${p.left} – ${p.right}`)
                        .join(", ")}
              </span>
            </p>
          ) : null}
          {question.kind === "CHOICE" && question.explanation ? (
            <p className="mt-1 text-sm italic text-foreground/80">
              {question.explanation}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        {checked ? (
          <Button
            size="lg"
            className="h-12 px-8 text-base"
            onClick={next}
            disabled={pending}
          >
            {index + 1 >= round.length ? "Finish" : "Continue"}
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-12 px-8 text-base"
            onClick={check}
            disabled={answer === null}
          >
            Check
          </Button>
        )}
      </div>
    </div>
  );
}

function ChoiceQuestion({
  question,
  answer,
  checked,
  onAnswer,
}: {
  question: Extract<Question, { kind: "CHOICE" }>;
  answer: number | null;
  checked: null | { correct: boolean };
  onAnswer: (a: Answer) => void;
}) {
  return (
    <>
      <p className="mb-5 text-2xl font-bold">{question.prompt}</p>
      <ul className="space-y-2.5">
        {question.options.map((option, i) => {
          const selected = answer === i;
          const revealCorrect = checked && i === question.answerIndex;
          const revealWrong = checked && selected && !checked.correct;

          return (
            <li key={`${option}-${i}`}>
              <button
                type="button"
                disabled={Boolean(checked)}
                onClick={() => onAnswer(i)}
                className={cn(
                  "w-full rounded-xl border-2 px-4 py-3.5 text-left text-base transition-colors",
                  revealCorrect
                    ? "border-[var(--success)] bg-[var(--success)]/10"
                    : revealWrong
                      ? "border-[var(--danger)] bg-[var(--danger)]/10"
                      : selected
                        ? "border-[var(--persona)] bg-[var(--persona-soft)]"
                        : "bg-card hover:border-[var(--persona-border)]",
                )}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function InputQuestion({
  question,
  answer,
  checked,
  onAnswer,
  onSubmit,
}: {
  question: Extract<Question, { kind: "INPUT" }>;
  answer: string;
  checked: null | { correct: boolean };
  onAnswer: (a: Answer) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <p className="mb-5 text-2xl font-bold">{question.prompt}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <Input
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={Boolean(checked)}
          placeholder="Type your answer…"
          aria-label="Your answer"
          autoFocus
          className="h-14 text-lg"
        />
      </form>
      {question.hint ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Hint: {question.hint}
        </p>
      ) : null}
    </>
  );
}

function MatchQuestion({
  question,
  answer,
  checked,
  onAnswer,
}: {
  question: Extract<Question, { kind: "MATCH" }>;
  answer: Record<string, string>;
  checked: null | { correct: boolean };
  onAnswer: (a: Answer) => void;
}) {
  // Right-hand options are shuffled once per question, not per render.
  const rights = useMemo(
    () => [...question.pairs.map((p) => p.right)].sort(),
    [question],
  );

  return (
    <div className="space-y-3">
      {question.pairs.map((pair) => (
        <div key={pair.left} className="flex flex-wrap items-center gap-2">
          <span className="min-w-28 font-semibold">{pair.left}</span>
          <div className="flex flex-wrap gap-2">
            {rights.map((right) => {
              const selected = answer[pair.left] === right;
              const isRight = checked && right === pair.right;
              const isWrongPick = checked && selected && right !== pair.right;

              return (
                <button
                  key={right}
                  type="button"
                  disabled={Boolean(checked)}
                  onClick={() => onAnswer({ ...answer, [pair.left]: right })}
                  className={cn(
                    "rounded-lg border-2 px-3 py-1.5 text-sm transition-colors",
                    isRight
                      ? "border-[var(--success)] bg-[var(--success)]/10"
                      : isWrongPick
                        ? "border-[var(--danger)] bg-[var(--danger)]/10"
                        : selected
                          ? "border-[var(--persona)] bg-[var(--persona-soft)]"
                          : "bg-card hover:border-[var(--persona-border)]",
                  )}
                >
                  {right}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionComplete({
  studentId,
  topicId,
  topicTitle,
  correctCount,
  total,
  xpEarned,
  level,
  streak,
  unlocked,
  startingPercent,
}: {
  studentId: string;
  topicId: string;
  topicTitle: string;
  correctCount: number;
  total: number;
  xpEarned: number;
  level: LevelBreakdown | null;
  streak: number | null;
  unlocked: { label: string; emoji: string }[];
  startingPercent: number;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-5 text-center">
      <div className="animate-pop">
        <p className="text-6xl" aria-hidden>
          {correctCount === total ? "🏆" : "🎉"}
        </p>
        <h2 className="mt-3 text-2xl font-bold">Lesson complete!</h2>
        <p className="mt-1 text-muted-foreground">
          {topicTitle} — {correctCount}/{total} correct
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold" style={{ color: "var(--persona)" }}>
            +{xpEarned}
          </p>
          <p className="text-xs text-muted-foreground">XP earned</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold" style={{ color: "var(--persona)" }}>
            🔥 {streak ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
      </div>

      {level ? (
        <div className="rounded-xl border bg-card p-4 text-left">
          <p className="mb-2 text-sm font-medium">Your level now</p>
          <LevelBar level={level} />
        </div>
      ) : null}

      {unlocked.length > 0 ? (
        <div className="animate-pop rounded-xl border bg-[var(--persona-soft)] p-4">
          <p className="font-semibold" style={{ color: "var(--persona)" }}>
            New item unlocked!
          </p>
          <p className="mt-1 text-sm">
            {unlocked.map((u) => `${u.emoji} ${u.label}`).join(" · ")}
          </p>
        </div>
      ) : null}

      <JournalPrompt
        studentId={studentId}
        topicId={topicId}
        topicTitle={topicTitle}
        startingPercent={startingPercent}
      />

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          size="lg"
          className="h-12 px-6 text-base"
          render={<Link href={`/student/${studentId}`} />}
        >
          Back to path
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 px-6 text-base"
          render={<Link href={`/student/${studentId}/practice/${topicId}`} />}
        >
          Practise again
        </Button>
      </div>
    </div>
  );
}
