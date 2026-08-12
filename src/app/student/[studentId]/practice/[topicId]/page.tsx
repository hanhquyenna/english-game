import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildLessonPath } from "@/lib/lesson-path";
import { buildRound } from "@/lib/practice";
import { PracticeSession } from "@/components/student/practice-session";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: PageProps<"/student/[studentId]/practice/[topicId]">) {
  const { studentId, topicId } = await params;

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const topics = await getTopicsWithProgress(klass.id, studentId);
  const path = buildLessonPath(topics);
  const node = path.find((n) => n.topic.id === topicId);

  // A locked or unassigned topic is not practisable — say so rather than
  // rendering an empty session.
  if (!node || node.state === "LOCKED") {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-4xl" aria-hidden>
            🔒
          </p>
          <p className="font-medium">Bài học này chưa mở khoá</p>
          <p className="text-sm text-muted-foreground">
            {node?.lockedReason ?? "Cô giáo chưa giao bài học này cho lớp."}
          </p>
          <Link
            href={`/student/${studentId}`}
            className="inline-block underline"
            style={{ color: "var(--persona)" }}
          >
            ← Quay lại đường học
          </Link>
        </CardContent>
      </Card>
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

  const round = buildRound(exercises ?? [], {
    masteredIds: new Set((correctAttempts ?? []).map((a) => a.exercise_id)),
    vocabMeanings: (vocab ?? []).map((v) => v.meaning),
    seed: Math.floor(Math.random() * 100000),
  });

  if (round.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-4xl" aria-hidden>
            📭
          </p>
          <p className="font-medium">Bài học này chưa có bài tập nào</p>
          <p className="text-sm text-muted-foreground">
            Cô giáo sẽ thêm bài tập sớm thôi.
          </p>
          <Link
            href={`/student/${studentId}`}
            className="inline-block underline"
            style={{ color: "var(--persona)" }}
          >
            ← Quay lại đường học
          </Link>
        </CardContent>
      </Card>
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
