import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  bandIndex,
  computeLevel,
  didBandChange,
  EXPECTED_HOURS_BY_BAND,
  MASTERY_THRESHOLD,
  type LevelBreakdown,
  type LevelInputs,
} from "@/lib/level-engine";

export type Db = SupabaseClient<Database>;

/**
 * Reads every input the Level Engine needs for one student straight from the
 * live tables. Nothing here is cached or estimated — if a number moves on a
 * screen, it moved because one of these queries returned something new.
 */
export async function gatherLevelInputs(
  db: Db,
  studentId: string,
): Promise<LevelInputs> {
  // Which class is the student in, and which topics have been assigned to it?
  const { data: enrollment } = await db
    .from("enrollments")
    .select("class_id, classes(cefr_level)")
    .eq("student_id", studentId)
    .maybeSingle();

  const classId = enrollment?.class_id ?? null;
  const classBand = enrollment?.classes?.cefr_level ?? "B1";

  const { data: assignedTopics } = classId
    ? await db
        .from("topics")
        .select("id")
        .eq("class_id", classId)
        .not("assigned_at", "is", null)
    : { data: [] as { id: string }[] };

  const topicIds = (assignedTopics ?? []).map((t) => t.id);

  // Level-appropriate vocab and grammar = the items inside assigned topics.
  const [{ data: vocabItems }, { data: grammarPoints }] = await Promise.all([
    topicIds.length
      ? db.from("vocab_items").select("id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
    topicIds.length
      ? db.from("grammar_points").select("id").in("topic_id", topicIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  const vocabIds = (vocabItems ?? []).map((v) => v.id);
  const grammarIds = (grammarPoints ?? []).map((g) => g.id);

  const [
    { data: vocabMastery },
    { data: grammarMastery },
    { data: sessions },
    { data: submissions },
    { data: progress },
  ] = await Promise.all([
    vocabIds.length
      ? db
          .from("vocab_mastery")
          .select("vocab_item_id, mastery_score")
          .eq("student_id", studentId)
          .in("vocab_item_id", vocabIds)
      : Promise.resolve({ data: [] as { mastery_score: number }[] }),
    grammarIds.length
      ? db
          .from("grammar_mastery")
          .select("grammar_point_id, mastery_score")
          .eq("student_id", studentId)
          .in("grammar_point_id", grammarIds)
      : Promise.resolve({ data: [] as { mastery_score: number }[] }),
    db.from("study_sessions").select("minutes").eq("student_id", studentId),
    db
      .from("submissions")
      .select("score")
      .eq("student_id", studentId)
      .not("score", "is", null),
    topicIds.length
      ? db
          .from("topic_progress")
          .select("topic_id, percent_complete")
          .eq("student_id", studentId)
          .in("topic_id", topicIds)
      : Promise.resolve(
          { data: [] as { topic_id: string; percent_complete: number }[] },
        ),
  ]);

  // Every assigned topic counts toward coverage, including untouched ones —
  // a topic with no progress row is a 0, not an omission.
  const progressByTopic = new Map(
    (progress ?? []).map((p) => [p.topic_id, Number(p.percent_complete)]),
  );
  const coveragePercents = topicIds.map((id) => progressByTopic.get(id) ?? 0);

  return {
    studyMinutes: (sessions ?? []).reduce(
      (sum, s) => sum + Number(s.minutes ?? 0),
      0,
    ),
    vocabTotal: vocabIds.length,
    vocabMastered: (vocabMastery ?? []).filter(
      (m) => Number(m.mastery_score) >= MASTERY_THRESHOLD,
    ).length,
    examScores: (submissions ?? [])
      .map((s) => Number(s.score))
      .filter((n) => Number.isFinite(n)),
    coveragePercents,
    grammarTotal: grammarIds.length,
    grammarMastered: (grammarMastery ?? []).filter(
      (m) => Number(m.mastery_score) >= MASTERY_THRESHOLD,
    ).length,
    expectedHours:
      EXPECTED_HOURS_BY_BAND[classBand] ?? EXPECTED_HOURS_BY_BAND.B1,
  };
}

/** The most recent LevelScore row for a student, or null if never computed. */
export async function latestLevelScore(db: Db, studentId: string) {
  const { data } = await db
    .from("level_scores")
    .select("*")
    .eq("student_id", studentId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Recompute, persist, and fan out the consequences.
 *
 * Called after every write that can move the number: an exercise attempt, a
 * graded submission, a logged study session, a mastery change, a topic
 * assignment. The inserted `level_scores` row is what all three personas'
 * screens are subscribed to — that insert is the realtime event that makes
 * the teacher's action show up on the parent's screen.
 */
export async function recomputeLevel(
  db: Db,
  studentId: string,
): Promise<LevelBreakdown> {
  const previous = await latestLevelScore(db, studentId);
  const inputs = await gatherLevelInputs(db, studentId);
  const breakdown = computeLevel(inputs);

  await db.from("level_scores").insert({
    student_id: studentId,
    cefr_band: breakdown.cefrBand,
    composite_score: breakdown.compositeScore,
    hours_score: breakdown.hoursScore,
    vocab_score: breakdown.vocabScore,
    exam_score: breakdown.examScore,
    coverage_score: breakdown.coverageScore,
    grammar_score: breakdown.grammarScore,
  });

  if (didBandChange(previous, breakdown)) {
    await onBandChange(db, studentId, previous!.cefr_band, breakdown.cefrBand);
  }

  return breakdown;
}

/**
 * A band change is the rare, meaningful progression event (§13): it notifies
 * the student and every linked parent, and swaps the avatar's rank frame.
 */
async function onBandChange(
  db: Db,
  studentId: string,
  fromBand: string,
  toBand: string,
) {
  const rankedUp = bandIndex(toBand) > bandIndex(fromBand);

  const { data: student } = await db
    .from("users")
    .select("name")
    .eq("id", studentId)
    .maybeSingle();

  const { data: parents } = await db
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", studentId);

  const recipients = [studentId, ...(parents ?? []).map((p) => p.parent_id)];

  await db.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      type: "LEVEL_UP" as const,
      payload: {
        studentId,
        studentName: student?.name ?? "",
        fromBand,
        toBand,
        rankedUp,
      },
    })),
  );

  // Rank frame follows the band, so the avatar visibly grows with real progress.
  const { data: frame } = await db
    .from("avatars")
    .select("id")
    .eq("category", "RANK_FRAME")
    .eq("unlock_rule", `cefr:${toBand}`)
    .maybeSingle();

  if (frame) {
    await db
      .from("student_avatars")
      .update({ current_rank_frame_id: frame.id })
      .eq("student_id", studentId);
  }
}

/** Recompute every student in a class — used after a topic is assigned. */
export async function recomputeClass(db: Db, classId: string) {
  const { data: enrolled } = await db
    .from("enrollments")
    .select("student_id")
    .eq("class_id", classId);

  for (const row of enrolled ?? []) {
    await recomputeLevel(db, row.student_id);
  }
}
