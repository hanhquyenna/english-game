"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle,
  X,
  XCircle,
} from "lucide-react";
import { isAnswerCorrect, type Question } from "@/lib/practice";
import { completePracticeRound, recordAttempt } from "@/lib/actions/student";
import type { LevelBreakdown } from "@/lib/level-engine";
import { JournalPrompt } from "@/components/student/journal-prompt";
import {
  BlockButton,
  Mono,
  ProgressTrack,
  Tile,
} from "@/components/student/ui";

type Answer = number | string | Record<string, string>;

/**
 * Exercise + Lesson Complete, ported from the prototype's ExerciseScreen and
 * CompleteScreen.
 *
 * Exercise: 2px-bordered header with ✕ and a progress bar, a mono eyebrow, a
 * Georgia 26/32 title, a bordered word card, 57px answer rows, and a sticky
 * footer that swaps the Check button for a feedback panel.
 *
 * Complete: primary-filled screen, a 108px card rotated 4°, Georgia 30 title,
 * two stat tiles, a mastery tile, and an accent Continue button.
 *
 * There are no hearts — the plan lists XP, streak and gems, and a counter that
 * gates nothing would be a placeholder.
 *
 * Each answer is written the moment it is given, so a parent watching another
 * tab sees the numbers move while their child is still practising.
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
  const [round] = useState(questions);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [checked, setChecked] = useState<null | { correct: boolean }>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [level, setLevel] = useState<LevelBreakdown | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [earnedGems, setEarnedGems] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const startedAt = useMemo(() => Date.now(), []);
  const question = round[index];
  const progress = Math.round(((index + (checked ? 1 : 0)) / round.length) * 100);

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
        for (const item of result.unlocked) {
          toast.success(`New item unlocked: ${item.label}`);
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
        const result = await completePracticeRound(studentId, minutes);
        setEarnedGems(result.earnedGems);
        setLevel(result.breakdown);
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
      <CompleteScreen
        studentId={studentId}
        topicId={topicId}
        topicTitle={topicTitle}
        correctCount={correctCount}
        total={round.length}
        earnedGems={earnedGems}
        streak={streak}
        level={level}
        startingPercent={startingPercent}
      />
    );
  }

  const correctText =
    question.kind === "CHOICE"
      ? question.options[question.answerIndex]
      : question.kind === "INPUT"
        ? question.answer
        : question.pairs.map((p) => `${p.left} – ${p.right}`).join(", ");

  return (
    <div className="flex min-h-full flex-col bg-st-card">
      <header className="flex items-center gap-3 border-b-2 border-st-fg p-4">
        <Link
          href={`/student/${studentId}`}
          aria-label="Exit practice"
          className="transition-opacity active:opacity-70"
        >
          <X size={21} style={{ color: "var(--st-muted-fg)" }} />
        </Link>
        <ProgressTrack className="flex-1" percent={progress} />
        <Mono className="font-black text-st-fg">
          {index + 1}/{round.length}
        </Mono>
      </header>

      <div className="flex-1 p-[22px] pb-[145px]">
        <Mono className="block uppercase" style={{ color: "var(--st-primary)" }}>
          {topicTitle} · {question.instruction}
        </Mono>

        <h1 className="st-display mb-6 mt-3.5 text-[26px] leading-[32px] text-st-fg">
          {question.kind === "CHOICE"
            ? "Select the correct answer"
            : question.kind === "INPUT"
              ? "Fill in the blank"
              : "Match the pairs"}
        </h1>

        {question.kind !== "MATCH" ? (
          <div
            className="mb-6 flex flex-col items-center rounded-[2px] border-2 border-st-fg p-[18px]"
            style={{ backgroundColor: "var(--st-peach)" }}
          >
            <p className="st-display text-[22px] text-st-primary">
              “{question.prompt}”
            </p>
            <Mono className="mt-1 text-st-muted-fg">
              {question.kind === "INPUT"
                ? (question.hint ?? "Type the missing word.")
                : "Tap the answer you know."}
            </Mono>
          </div>
        ) : null}

        {question.kind === "CHOICE" ? (
          <ul className="flex flex-col gap-[11px]">
            {question.options.map((option, i) => {
              const selected = answer === i;
              const isRight = checked && i === question.answerIndex;
              const isWrong = checked && selected && !checked.correct;
              return (
                <li key={`${option}-${i}`}>
                  <button
                    type="button"
                    disabled={Boolean(checked)}
                    onClick={() => setAnswer(i)}
                    className="flex min-h-[57px] w-full items-center justify-between rounded-[2px] border-2 px-[17px] text-left transition-opacity active:opacity-70"
                    style={{
                      backgroundColor: isRight
                        ? "var(--st-mint)"
                        : isWrong
                          ? "var(--st-peach)"
                          : selected
                            ? "var(--st-lavender)"
                            : "var(--st-card)",
                      borderColor: isRight
                        ? "var(--st-primary)"
                        : isWrong
                          ? "var(--st-destructive)"
                          : selected
                            ? "var(--st-primary)"
                            : "var(--st-fg)",
                    }}
                  >
                    <span
                      className="st-display text-[16px] font-bold"
                      style={{
                        color: isWrong
                          ? "var(--st-destructive)"
                          : "var(--st-fg)",
                      }}
                    >
                      {option}
                    </span>
                    {isRight ? (
                      <CheckCircle
                        size={19}
                        style={{ color: "var(--st-primary)" }}
                      />
                    ) : isWrong ? (
                      <XCircle
                        size={19}
                        style={{ color: "var(--st-destructive)" }}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : question.kind === "INPUT" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <input
              value={(answer as string) ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={Boolean(checked)}
              placeholder="Type your answer…"
              aria-label="Your answer"
              autoFocus
              className="st-display min-h-[57px] w-full rounded-[2px] border-2 border-st-fg bg-st-card px-[17px] text-[16px] font-bold text-st-fg outline-none"
            />
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {question.pairs.map((pair) => {
              const chosen = (answer as Record<string, string>) ?? {};
              return (
                <div key={pair.left} className="flex flex-wrap items-center gap-2">
                  <span className="st-display min-w-24 text-[16px] text-st-fg">
                    {pair.left}
                  </span>
                  {[...question.pairs.map((p) => p.right)].sort().map((right) => {
                    const on = chosen[pair.left] === right;
                    const isRight = checked && right === pair.right;
                    const isWrong = checked && on && right !== pair.right;
                    return (
                      <button
                        key={right}
                        type="button"
                        disabled={Boolean(checked)}
                        onClick={() =>
                          setAnswer({ ...chosen, [pair.left]: right })
                        }
                        className="rounded-[2px] border-2 px-3 py-1.5 transition-opacity active:opacity-70"
                        style={{
                          backgroundColor: isRight
                            ? "var(--st-mint)"
                            : isWrong
                              ? "var(--st-peach)"
                              : on
                                ? "var(--st-lavender)"
                                : "var(--st-card)",
                          borderColor: isWrong
                            ? "var(--st-destructive)"
                            : "var(--st-fg)",
                        }}
                      >
                        <Mono className="text-st-fg">{right}</Mono>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t-2 border-st-fg bg-st-card p-4">
        {checked ? (
          <div
            className="flex items-center gap-2.5 rounded-[2px] border-2 border-st-fg p-3"
            style={{
              backgroundColor: checked.correct
                ? "var(--st-mint)"
                : "var(--st-peach)",
            }}
          >
            <span className="flex-1">
              <span
                className="st-display mb-1 block text-[17px]"
                style={{
                  color: checked.correct
                    ? "var(--st-primary)"
                    : "var(--st-destructive)",
                }}
              >
                {checked.correct ? "Excellent!" : `Correct answer: ${correctText}`}
              </span>
              <Mono className="block text-st-fg">
                {checked.correct
                  ? "Mastery went up"
                  : "Keep going, you got this"}
              </Mono>
            </span>
            <BlockButton
              onClick={next}
              disabled={pending}
              tone={checked.correct ? "primary" : "destructive"}
              className="min-h-[45px] px-4"
            >
              {index + 1 >= round.length ? "Finish" : "Continue"}
              <ArrowRight size={17} aria-hidden />
            </BlockButton>
          </div>
        ) : (
          <BlockButton
            onClick={check}
            disabled={answer === null}
            tone={answer === null ? "muted" : "primary"}
            className="w-full"
          >
            Check
            <Check size={17} aria-hidden />
          </BlockButton>
        )}
      </div>
    </div>
  );
}

function CompleteScreen({
  studentId,
  topicId,
  topicTitle,
  correctCount,
  total,
  earnedGems,
  streak,
  level,
  startingPercent,
}: {
  studentId: string;
  topicId: string;
  topicTitle: string;
  correctCount: number;
  total: number;
  earnedGems: number;
  streak: number | null;
  level: LevelBreakdown | null;
  startingPercent: number;
}) {
  return (
    <div
      className="flex min-h-full flex-col items-center px-[25px] pb-10 pt-[21%]"
      style={{ backgroundColor: "var(--st-primary)" }}
    >
      <div
        className="mb-6 flex size-[108px] rotate-[4deg] items-center justify-center rounded-[2px] border-[3px] border-st-fg"
        style={{ backgroundColor: "var(--st-card)" }}
      >
        <Award size={44} style={{ color: "var(--st-accent)" }} aria-hidden />
      </div>

      <h1 className="st-display text-center text-[30px] text-st-primary-fg">
        Lesson Complete!
      </h1>
      <Mono className="mb-[26px] mt-[7px] text-st-primary-fg">
        {topicTitle} · {correctCount}/{total} correct
      </Mono>

      <div className="flex w-full gap-3">
        <Tile
          className="flex flex-1 flex-col items-center p-3.5"
          style={{ backgroundColor: "rgba(244,236,221,0.92)" }}
        >
          <span className="st-display text-[22px] text-st-fg">
            +{earnedGems}
          </span>
          <Mono className="text-st-muted-fg">Gems</Mono>
        </Tile>
        <Tile
          className="flex flex-1 flex-col items-center p-3.5"
          style={{ backgroundColor: "rgba(244,236,221,0.92)" }}
        >
          <span className="st-display text-[22px] text-st-fg">
            {streak ?? "—"}
          </span>
          <Mono className="text-st-muted-fg">Day streak</Mono>
        </Tile>
      </div>

      {level ? (
        <Tile
          className="mt-[15px] w-full p-4"
          style={{
            backgroundColor: "rgba(244,236,221,0.16)",
            borderColor: "var(--st-primary-fg)",
            boxShadow: "3px 3px 0 0 var(--st-primary-fg)",
          }}
        >
          <div className="flex items-center justify-between">
            <Mono className="text-st-primary-fg">{level.cefrBand}</Mono>
            <Mono className="text-st-primary-fg">
              {level.progressToNextBand}%
            </Mono>
          </div>
          <ProgressTrack
            className="mt-2.5"
            percent={level.progressToNextBand}
            trackColor="rgba(244,236,221,0.25)"
            fillColor="var(--st-accent)"
          />
          <Mono className="mt-2 block text-st-primary-fg">
            {level.nextBand
              ? `Keep going to reach ${level.nextBand}.`
              : "Top band reached."}
          </Mono>
        </Tile>
      ) : null}

      <div className="mt-4 w-full">
        <JournalPrompt
          studentId={studentId}
          topicId={topicId}
          topicTitle={topicTitle}
          startingPercent={startingPercent}
        />
      </div>

      <Link href={`/student/${studentId}`} className="mt-[22px] w-full">
        <BlockButton
          tone="accent"
          className="min-h-[54px] w-full"
          type="button"
        >
          Continue
          <ArrowRight size={18} aria-hidden />
        </BlockButton>
      </Link>
    </div>
  );
}
