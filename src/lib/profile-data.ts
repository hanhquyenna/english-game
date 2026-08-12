import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { getClassForStudent, getRoster, type StudentSummary } from "@/lib/queries";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";

/**
 * Everything a profile needs, for the viewer or any classmate.
 *
 * Teacher comments are real: they come from marked journal entries and from
 * kudos notes, newest first — the same records the teacher wrote.
 */
export async function getProfileData(viewerId: string, targetId: string) {
  const klass = await getClassForStudent(viewerId);
  if (!klass) return null;

  const roster = await getRoster(klass.id);
  const ranked = [...roster].sort(
    (a, b) => (b.level?.compositeScore ?? 0) - (a.level?.compositeScore ?? 0),
  );

  const index = ranked.findIndex((s) => s.id === targetId);
  if (index < 0) return null;
  const student: StudentSummary = ranked[index];

  const db = createServerSupabase();
  const [{ data: mastery }, { data: journals }, { data: kudos }] =
    await Promise.all([
      db
        .from("vocab_mastery")
        .select("mastery_score")
        .eq("student_id", targetId)
        .gte("mastery_score", MASTERY_THRESHOLD),
      db
        .from("journal_entries")
        .select("created_at, teacher_comment")
        .eq("student_id", targetId)
        .not("teacher_comment", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
      db
        .from("kudos")
        .select("created_at, note, tag")
        .eq("student_id", targetId)
        .not("note", "is", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const comments = [
    ...(journals ?? []).map((j) => ({
      date: j.created_at,
      text: j.teacher_comment as string,
    })),
    ...(kudos ?? []).map((k) => ({
      date: k.created_at,
      text: k.note as string,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    student,
    rank: index + 1,
    className: klass.name,
    vocabMastered: (mastery ?? []).length,
    comments,
  };
}
