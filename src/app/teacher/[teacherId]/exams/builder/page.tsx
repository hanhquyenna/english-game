import { notFound } from "next/navigation";
import { getClassForTeacher, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  ExamBuilderClient,
  type ExerciseBankItem,
} from "@/components/teacher/exam-builder-client";

export const dynamic = "force-dynamic";

export default async function ExamBuilderPage({
  params,
}: PageProps<"/teacher/[teacherId]/exams/builder">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) notFound();

  const db = createServerSupabase();
  const topicsRaw = await getTopicsWithProgress(klass.id);
  const topicIds = topicsRaw.map((t) => t.id);

  const { data: exercisesRaw } = topicIds.length
    ? await db
        .from("exercises")
        .select("*, topics(title)")
        .in("topic_id", topicIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const exerciseBank: ExerciseBankItem[] = (exercisesRaw ?? []).map((e) => {
    const content = (e.content ?? {}) as Record<string, unknown>;
    const promptOrTerm =
      String(content.prompt ?? content.term ?? content.instructions ?? "Câu hỏi");

    return {
      id: e.id,
      topicId: e.topic_id,
      topicTitle: (e.topics as { title?: string } | null)?.title ?? "Bài học",
      type: e.type,
      skill: e.skill ?? "VOCAB",
      promptOrTerm,
    };
  });

  const topics = topicsRaw.map((t) => ({ id: t.id, title: t.title }));

  return (
    <ExamBuilderClient
      teacherId={teacherId}
      classId={klass.id}
      topics={topics}
      exerciseBank={exerciseBank}
    />
  );
}
