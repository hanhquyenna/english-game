import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { VaultReviewClient } from "@/components/student/vault-review-client";
import type { ReviewItem } from "@/lib/sm2";

export const dynamic = "force-dynamic";

export default async function VaultReviewPage({
  params,
}: PageProps<"/student/[studentId]/vault/review">) {
  const { studentId } = await params;

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const db = createServerSupabase();
  const topics = (await getTopicsWithProgress(klass.id, studentId)).filter(
    (t) => t.assigned_at,
  );
  const topicIds = topics.map((t) => t.id);

  const [
    { data: vocabRaw },
    { data: grammarRaw },
    { data: vMastery },
    { data: gMastery },
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

  const items: ReviewItem[] = [];

  for (const v of vocabRaw ?? []) {
    const m = vMasteryMap.get(v.id);
    items.push({
      id: v.id,
      type: "vocab",
      term: v.term,
      meaningOrExplanation: v.meaning,
      example: v.example ?? null,
      masteryScore: m?.score ?? 0,
      lastReviewedAt: m?.lastReviewedAt ?? null,
    });
  }

  for (const g of grammarRaw ?? []) {
    const m = gMasteryMap.get(g.id);
    items.push({
      id: g.id,
      type: "grammar",
      term: g.name,
      meaningOrExplanation: g.explanation,
      example: null,
      masteryScore: m?.score ?? 0,
      lastReviewedAt: m?.lastReviewedAt ?? null,
    });
  }

  return <VaultReviewClient studentId={studentId} initialItems={items} />;
}
