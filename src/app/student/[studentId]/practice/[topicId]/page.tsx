import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildLessonPath } from "@/lib/lesson-path";
import { buildRound } from "@/lib/practice";
import { sliceForLevel } from "@/lib/islands";
import { PracticeSession } from "@/components/student/practice-session";
import { Mono, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/practice/[topicId]">) {
  const { studentId, topicId } = await params;
  const { level } = await searchParams;
  const levelNumber = Number(level);

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const topics = await getTopicsWithProgress(klass.id, studentId);
  const path = buildLessonPath(topics);
  const node = path.find((n) => n.topic.id === topicId);

  // A locked or unassigned topic is not practisable — say so rather than
  // rendering an empty session.
  if (!node || node.state === "LOCKED") {
    return (
      <Tile
        className="m-5 p-6 text-center"
        style={{ backgroundColor: "var(--st-card)" }}
      >
        <p className="st-display text-[17px] text-st-fg">This lesson is locked</p>
        <Mono className="mt-2 block text-st-muted-fg">
          {node?.lockedReason ?? "Your teacher has not assigned this unit yet."}
        </Mono>
        <Link
          href={`/student/${studentId}`}
          className="st-mono mt-4 inline-block font-black uppercase tracking-[0.6px] text-st-primary"
        >
          ← Back to your path
        </Link>
      </Tile>
    );
  }

  const db = createServerSupabase();
  const [{ data: exercises }, { data: vocab }, { data: correctAttempts }] =
    await Promise.all([
      db
        .from("exercises")
        .select("id, type, content, vocab_item_id")
        .eq("topic_id", topicId),
      db.from("vocab_items").select("meaning").eq("topic_id", topicId),
      db
        .from("exercise_attempts")
        .select("exercise_id")
        .eq("student_id", studentId)
        .eq("correct", true),
    ]);

  // A level is a fixed slice of the unit's exercises, so "Level 3" always
  // means the same questions. Without a level we practise the whole unit.
  const pool =
    Number.isFinite(levelNumber) && levelNumber > 0
      ? sliceForLevel(exercises ?? [], levelNumber)
      : (exercises ?? []);

  const round = buildRound(pool, {
    masteredIds: new Set((correctAttempts ?? []).map((a) => a.exercise_id)),
    vocabMeanings: (vocab ?? []).map((v) => v.meaning),
    seed: Math.floor(Math.random() * 100000),
  });

  if (round.length === 0) {
    return (
      <Tile
        className="m-5 p-6 text-center"
        style={{ backgroundColor: "var(--st-card)" }}
      >
        <p className="st-display text-[17px] text-st-fg">
          No exercises in this lesson yet
        </p>
        <Mono className="mt-2 block text-st-muted-fg">
          Your teacher will add some soon.
        </Mono>
        <Link
          href={`/student/${studentId}`}
          className="st-mono mt-4 inline-block font-black uppercase tracking-[0.6px] text-st-primary"
        >
          ← Back to your path
        </Link>
      </Tile>
    );
  }

  return (
    <PracticeSession
      studentId={studentId}
      topicId={topicId}
      topicTitle={node.topic.title}
      questions={round}
      startingPercent={node.percentComplete}
    />
  );
}
