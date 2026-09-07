import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildLessonPath } from "@/lib/lesson-path";
import { buildRound } from "@/lib/practice";
import { sliceForLevel } from "@/lib/islands";
import { PracticeSession } from "@/components/student/practice-session";
import { PracticeSessionRunner } from "@/components/student/practice-session-runner";
import { Mono, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; topicId: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { studentId, topicId } = await params;
  const { level } = await searchParams;
  const levelNumber = Number(level);
  const db = createServerSupabase();

  // 1. First check if topicId matches a practice_session created by Game Loop v1 (C2)
  const { data: session } = await (db as any)
    .from("practice_sessions")
    .select("id, mode, skill_tags, question_count")
    .eq("id", topicId)
    .maybeSingle();

  if (session) {
    const { data: items } = await (db as any)
      .from("practice_session_items")
      .select("exercise_id, resolved, exercises(id, topic_id, type, content, skill_tag)")
      .eq("session_id", (session as any).id)
      .order("order");

    const exercises = ((items as any[]) ?? [])
      .map((item: any) => item.exercises)
      .filter(Boolean);

    return (
      <PracticeSessionRunner
        studentId={studentId}
        sessionId={(session as any).id}
        mode={(session as any).mode as "mistake_review" | "skill_boost"}
        exercises={exercises as any[]}
      />
    );
  }

  // 2. Otherwise handle standard topic practice
  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const topics = await getTopicsWithProgress(klass.id, studentId);
  const path = buildLessonPath(topics);
  const node = path.find((n) => n.topic.id === topicId);

  if (!node || node.state === "LOCKED") {
    return (
      <Tile
        className="m-5 p-6 text-center"
        style={{ backgroundColor: "var(--st-card)" }}
      >
        <p className="st-display text-[17px] text-st-fg">Bài học này đã bị khóa</p>
        <Mono className="mt-2 block text-st-muted-fg">
          {node?.lockedReason ?? "Giáo viên chưa giao bài học này."}
        </Mono>
        <Link
          href={`/student/${studentId}`}
          className="st-mono mt-4 inline-flex items-center gap-1.5 font-black uppercase tracking-[0.6px] text-st-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại hành trình
        </Link>
      </Tile>
    );
  }

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
          Chưa có bài tập trong bài học này
        </p>
        <Mono className="mt-2 block text-st-muted-fg">
          Giáo viên sẽ cập nhật bài tập sớm.
        </Mono>
        <Link
          href={`/student/${studentId}`}
          className="st-mono mt-4 inline-flex items-center gap-1.5 font-black uppercase tracking-[0.6px] text-st-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại hành trình
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
