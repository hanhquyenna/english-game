import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  VaultClient,
  type GrammarPointData,
  type ScoreData,
  type TopicData,
  type VocabItemData,
} from "@/components/student/vault-client";

export const dynamic = "force-dynamic";

export default async function VaultPage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/vault">) {
  const { studentId } = await params;
  const { unit } = await searchParams;

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const db = createServerSupabase();
  const topicsRaw = (await getTopicsWithProgress(klass.id, studentId)).filter(
    (t) => t.assigned_at,
  );
  const topicIds = topicsRaw.map((t) => t.id);

  const [
    { data: vocabRaw },
    { data: grammarRaw },
    { data: vMastery },
    { data: gMastery },
    { data: submissionsRaw },
  ] = await Promise.all([
    topicIds.length
      ? db.from("vocab_items").select("*").in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
    topicIds.length
      ? db.from("grammar_points").select("*").in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
    db
      .from("vocab_mastery")
      .select("vocab_item_id, mastery_score, last_reviewed_at")
      .eq("student_id", studentId),
    db
      .from("grammar_mastery")
      .select("grammar_point_id, mastery_score, last_reviewed_at")
      .eq("student_id", studentId),
    db
      .from("submissions")
      .select("id, exam_id, score, submitted_at, exams(title)")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false }),
  ]);

  const vMasteryMap = new Map(
    (vMastery ?? []).map((m) => [
      m.vocab_item_id,
      { score: Number(m.mastery_score), lastReviewedAt: m.last_reviewed_at },
    ]),
  );

  const gMasteryMap = new Map(
    (gMastery ?? []).map((m) => [
      m.grammar_point_id,
      { score: Number(m.mastery_score), lastReviewedAt: m.last_reviewed_at },
    ]),
  );

  const topics: TopicData[] = topicsRaw.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle ?? null,
  }));

  const vocab: VocabItemData[] = (vocabRaw ?? []).map((v) => {
    const m = vMasteryMap.get(v.id);
    return {
      id: v.id,
      topic_id: v.topic_id,
      term: v.term,
      meaning: v.meaning,
      example: v.example ?? null,
      masteryScore: m?.score ?? 0,
      lastReviewedAt: m?.lastReviewedAt ?? null,
    };
  });

  const grammar: GrammarPointData[] = (grammarRaw ?? []).map((g) => {
    const m = gMasteryMap.get(g.id);
    return {
      id: g.id,
      topic_id: g.topic_id,
      name: g.name,
      explanation: g.explanation,
      masteryScore: m?.score ?? 0,
      lastReviewedAt: m?.lastReviewedAt ?? null,
    };
  });

  const scores: ScoreData[] = (submissionsRaw ?? []).map((s) => ({
    id: s.id,
    examId: s.exam_id,
    examTitle: (s as unknown as { exams?: { title: string } }).exams?.title ?? "Exam",
    score: s.score !== null ? Number(s.score) : null,
    submittedAt: s.submitted_at,
  }));

  return (
    <VaultClient
      studentId={studentId}
      topics={topics}
      vocab={vocab}
      grammar={grammar}
      scores={scores}
      openUnitId={typeof unit === "string" ? unit : null}
    />
  );
}
