"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { recomputeClass, recomputeLevel } from "@/lib/level-service";
import type { Enums, Json } from "@/lib/database.types";

/**
 * Every teacher action writes real rows, notifies the people who should know,
 * and — where the change can move a level — triggers a recompute. The recompute
 * inserts a `level_scores` row, which is the realtime event the student and
 * parent screens are subscribed to.
 */

async function notifyClass(
  db: ReturnType<typeof createServerSupabase>,
  classId: string,
  type: Enums<"notification_type">,
  payload: Record<string, unknown>,
  { includeParents = true }: { includeParents?: boolean } = {},
) {
  const { data: enrolled } = await db
    .from("enrollments")
    .select("student_id")
    .eq("class_id", classId);

  const studentIds = (enrolled ?? []).map((e) => e.student_id);
  const recipients = new Set<string>(studentIds);

  if (includeParents && studentIds.length) {
    const { data: links } = await db
      .from("parent_links")
      .select("parent_id")
      .in("student_id", studentIds);
    for (const l of links ?? []) recipients.add(l.parent_id);
  }

  if (recipients.size === 0) return;

  await db.from("notifications").insert(
    [...recipients].map((user_id) => ({
      user_id,
      type,
      payload: payload as Json,
    })),
  );
}

/** §7 step 2: assign a built unit to the class. */
export async function assignTopic(topicId: string) {
  const db = createServerSupabase();

  const { data: topic } = await db
    .from("topics")
    .select("id, title, class_id, assigned_at")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) throw new Error("Không tìm thấy bài học");
  if (topic.assigned_at) return { alreadyAssigned: true };

  await db
    .from("topics")
    .update({ assigned_at: new Date().toISOString() })
    .eq("id", topicId);

  await notifyClass(db, topic.class_id, "NEW_ASSIGNMENT", {
    topicId: topic.id,
    topicTitle: topic.title,
  });

  // Assigning changes the coverage denominator for every student in the class.
  await recomputeClass(db, topic.class_id);

  revalidatePath("/", "layout");
  return { alreadyAssigned: false };
}

export async function unassignTopic(topicId: string) {
  const db = createServerSupabase();
  const { data: topic } = await db
    .from("topics")
    .select("class_id")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) throw new Error("Không tìm thấy bài học");

  await db.from("topics").update({ assigned_at: null }).eq("id", topicId);
  await recomputeClass(db, topic.class_id);
  revalidatePath("/", "layout");
}

export async function createTopic(classId: string, title: string) {
  const db = createServerSupabase();
  const clean = title.trim();
  if (!clean) throw new Error("Tên bài học không được để trống");

  const { data: last } = await db
    .from("topics")
    .select("order")
    .eq("class_id", classId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await db
    .from("topics")
    .insert({
      class_id: classId,
      title: clean,
      order: (last?.order ?? 0) + 1,
      cefr_level: "B1",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return data.id;
}

export async function renameTopic(topicId: string, title: string) {
  const db = createServerSupabase();
  const clean = title.trim();
  if (!clean) throw new Error("Tên bài học không được để trống");
  await db.from("topics").update({ title: clean }).eq("id", topicId);
  revalidatePath("/", "layout");
}

export async function addVocabItem(
  topicId: string,
  term: string,
  meaning: string,
  example: string,
  teacherId: string,
) {
  const db = createServerSupabase();
  if (!term.trim() || !meaning.trim()) {
    throw new Error("Cần nhập cả từ và nghĩa");
  }

  const { data, error } = await db
    .from("vocab_items")
    .insert({
      topic_id: topicId,
      term: term.trim(),
      meaning: meaning.trim(),
      example: example.trim() || null,
      cefr_level: "B1",
    })
    .select("id, term, meaning, example")
    .single();

  if (error) throw new Error(error.message);

  // A vocab item is only useful if a student can practise it, so it always
  // gets its flashcard exercise.
  await db.from("exercises").insert({
    topic_id: topicId,
    type: "VOCAB_CARD",
    vocab_item_id: data.id,
    content: {
      term: data.term,
      meaning: data.meaning,
      example: data.example,
    } as Json,
    created_by_teacher_id: teacherId,
  });

  revalidatePath("/", "layout");
}

export async function deleteVocabItem(vocabItemId: string) {
  const db = createServerSupabase();
  await db.from("exercises").delete().eq("vocab_item_id", vocabItemId);
  await db.from("vocab_items").delete().eq("id", vocabItemId);
  revalidatePath("/", "layout");
}

export async function addGrammarPoint(
  topicId: string,
  name: string,
  explanation: string,
) {
  const db = createServerSupabase();
  if (!name.trim() || !explanation.trim()) {
    throw new Error("Cần nhập cả tên và giải thích");
  }
  const { error } = await db.from("grammar_points").insert({
    topic_id: topicId,
    name: name.trim(),
    explanation: explanation.trim(),
    cefr_level: "B1",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteGrammarPoint(grammarPointId: string) {
  const db = createServerSupabase();
  await db.from("exercises").delete().eq("grammar_point_id", grammarPointId);
  await db.from("grammar_points").delete().eq("id", grammarPointId);
  revalidatePath("/", "layout");
}

/** Manual exercise builder — MCQ / fill-blank / matching (§6 teacher 1). */
export async function createExercise(input: {
  topicId: string;
  teacherId: string;
  type: Enums<"exercise_type">;
  grammarPointId?: string | null;
  content: Record<string, unknown>;
}) {
  const db = createServerSupabase();

  if (input.type === "MCQ") {
    const options = (input.content.options as string[]) ?? [];
    if (options.filter((o) => o.trim()).length < 2) {
      throw new Error("Câu trắc nghiệm cần ít nhất 2 lựa chọn");
    }
  }
  if (input.type === "FILL_BLANK" && !String(input.content.answer ?? "").trim()) {
    throw new Error("Cần nhập đáp án");
  }

  const { error } = await db.from("exercises").insert({
    topic_id: input.topicId,
    type: input.type,
    grammar_point_id: input.grammarPointId || null,
    content: input.content as Json,
    created_by_teacher_id: input.teacherId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteExercise(exerciseId: string) {
  const db = createServerSupabase();
  await db.from("exercise_attempts").delete().eq("exercise_id", exerciseId);
  await db.from("exercises").delete().eq("id", exerciseId);
  revalidatePath("/", "layout");
}

/** Build an exam from a topic's MCQ exercises and publish it to the class. */
export async function createExam(
  classId: string,
  topicId: string,
  title: string,
) {
  const db = createServerSupabase();

  const { data: exercises } = await db
    .from("exercises")
    .select("id")
    .eq("topic_id", topicId)
    .in("type", ["MCQ", "FILL_BLANK"]);

  const ids = (exercises ?? []).map((e) => e.id);
  if (ids.length === 0) {
    throw new Error("Bài học này chưa có câu hỏi nào để ra đề");
  }

  const { data, error } = await db
    .from("exams")
    .insert({
      class_id: classId,
      topic_id: topicId,
      title: title.trim() || "Bài kiểm tra",
      exercise_ids: ids as Json,
      published_at: new Date().toISOString(),
    })
    .select("id, title")
    .single();

  if (error) throw new Error(error.message);

  await notifyClass(db, classId, "EXAM_RESULT", {
    examId: data.id,
    examTitle: data.title,
    published: true,
  });

  revalidatePath("/", "layout");
  return data.id;
}

export async function giveKudos(
  studentId: string,
  teacherId: string,
  tag: Enums<"kudos_tag">,
  note?: string,
) {
  const db = createServerSupabase();

  const { error } = await db.from("kudos").insert({
    student_id: studentId,
    teacher_id: teacherId,
    tag,
    note: note?.trim() || null,
  });
  if (error) throw new Error(error.message);

  const { data: student } = await db
    .from("users")
    .select("name")
    .eq("id", studentId)
    .maybeSingle();

  const { data: parents } = await db
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", studentId);

  await db.from("notifications").insert(
    [studentId, ...(parents ?? []).map((p) => p.parent_id)].map((user_id) => ({
      user_id,
      type: "KUDOS_RECEIVED" as const,
      payload: {
        studentName: student?.name ?? "",
        tag,
        note: note?.trim() ?? null,
      } as Json,
    })),
  );

  revalidatePath("/", "layout");
}

export async function createClassPost(
  classId: string,
  teacherId: string,
  text: string,
) {
  const db = createServerSupabase();
  const clean = text.trim();
  if (!clean) throw new Error("Nội dung không được để trống");

  const { error } = await db
    .from("class_posts")
    .insert({ class_id: classId, teacher_id: teacherId, text: clean });
  if (error) throw new Error(error.message);

  await notifyClass(db, classId, "CLASS_POST", { text: clean });
  revalidatePath("/", "layout");
}

export async function commentOnJournal(entryId: string, comment: string) {
  const db = createServerSupabase();
  const clean = comment.trim();
  if (!clean) throw new Error("Nhận xét không được để trống");

  const { data: entry } = await db
    .from("journal_entries")
    .select("student_id")
    .eq("id", entryId)
    .maybeSingle();

  await db
    .from("journal_entries")
    .update({ teacher_comment: clean })
    .eq("id", entryId);

  if (entry) {
    const { data: parents } = await db
      .from("parent_links")
      .select("parent_id")
      .eq("student_id", entry.student_id);

    await db.from("notifications").insert(
      [entry.student_id, ...(parents ?? []).map((p) => p.parent_id)].map(
        (user_id) => ({
          user_id,
          type: "KUDOS_RECEIVED" as const,
          payload: { journalComment: clean } as Json,
        }),
      ),
    );
  }

  revalidatePath("/", "layout");
}

/**
 * §7 step 6 — grading. Two paths, both real:
 *   - auto-score an MCQ/fill-blank submission against the stored answers,
 *   - or accept a mark the teacher types in.
 *
 * Grading a topic's exam also raises grammar mastery for the grammar points
 * that exam actually covers, proportionally to the mark. That is why the demo
 * script's "Minh's grammar input jumps" is literally true rather than a
 * coincidence of the exam weighting.
 */
export async function gradeSubmission(submissionId: string, manualScore?: number) {
  const db = createServerSupabase();

  const { data: submission } = await db
    .from("submissions")
    .select("id, exam_id, student_id, answers, exams(id, title, topic_id, exercise_ids)")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) throw new Error("Không tìm thấy bài làm");

  const exam = submission.exams;
  let score: number;

  if (typeof manualScore === "number") {
    if (!Number.isFinite(manualScore) || manualScore < 0 || manualScore > 100) {
      throw new Error("Điểm phải nằm trong khoảng 0–100");
    }
    score = manualScore;
  } else {
    score = await autoScore(db, submission.answers, exam?.exercise_ids);
  }

  await db
    .from("submissions")
    .update({ score, graded_at: new Date().toISOString() })
    .eq("id", submissionId);

  // Raise grammar mastery for the points this exam covered.
  if (exam?.topic_id) {
    await applyGrammarGain(db, submission.student_id, exam.topic_id, score);
  }

  const breakdown = await recomputeLevel(db, submission.student_id);

  const { data: parents } = await db
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", submission.student_id);

  await db.from("notifications").insert(
    [submission.student_id, ...(parents ?? []).map((p) => p.parent_id)].map(
      (user_id) => ({
        user_id,
        type: "EXAM_RESULT" as const,
        payload: {
          examTitle: exam?.title ?? "Bài kiểm tra",
          score,
          cefrBand: breakdown.cefrBand,
        } as Json,
      }),
    ),
  );

  revalidatePath("/", "layout");
  return { score, breakdown };
}

async function autoScore(
  db: ReturnType<typeof createServerSupabase>,
  answers: Json,
  exerciseIds: Json | undefined,
): Promise<number> {
  const ids = Array.isArray(exerciseIds) ? (exerciseIds as string[]) : [];
  if (ids.length === 0) return 0;

  const { data: exercises } = await db
    .from("exercises")
    .select("id, type, content")
    .in("id", ids);

  const given = (answers ?? {}) as Record<string, unknown>;
  let correct = 0;

  for (const ex of exercises ?? []) {
    const content = ex.content as Record<string, unknown>;
    const answer = given[ex.id];

    if (ex.type === "MCQ" && typeof content.answerIndex === "number") {
      if (Number(answer) === content.answerIndex) correct++;
    } else if (ex.type === "FILL_BLANK" && typeof content.answer === "string") {
      if (
        String(answer ?? "").trim().toLowerCase() ===
        content.answer.trim().toLowerCase()
      ) {
        correct++;
      }
    }
  }

  return Math.round((correct / (exercises?.length || 1)) * 100);
}

/**
 * Doing well on a topic's exam is evidence of grammar mastery for that topic.
 * Mastery only ever moves up here, and never past the exam's own mark.
 */
async function applyGrammarGain(
  db: ReturnType<typeof createServerSupabase>,
  studentId: string,
  topicId: string,
  score: number,
) {
  const { data: points } = await db
    .from("grammar_points")
    .select("id")
    .eq("topic_id", topicId);

  if (!points?.length) return;

  const { data: existing } = await db
    .from("grammar_mastery")
    .select("grammar_point_id, mastery_score")
    .eq("student_id", studentId)
    .in(
      "grammar_point_id",
      points.map((p) => p.id),
    );

  const current = new Map(
    (existing ?? []).map((r) => [r.grammar_point_id, Number(r.mastery_score)]),
  );

  await db.from("grammar_mastery").upsert(
    points.map((p) => ({
      student_id: studentId,
      grammar_point_id: p.id,
      mastery_score: Math.max(current.get(p.id) ?? 0, score),
      last_reviewed_at: new Date().toISOString(),
    })),
    { onConflict: "student_id,grammar_point_id" },
  );
}
