"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { recomputeLevel } from "@/lib/level-service";
import {
  computeStreak,
  GEMS_PER_ROUND,
  isoDate,
  isUnlocked,
  xpForAttempt,
} from "@/lib/progression";
import { bandIndex } from "@/lib/level-engine";
import type { Json } from "@/lib/database.types";

type Db = ReturnType<typeof createServerSupabase>;

/** How much one attempt moves a mastery score. */
const MASTERY_GAIN = 25;
const MASTERY_LOSS = 10;

/**
 * One practice answer. Recorded immediately rather than batched at the end of
 * the session, so a parent watching the other tab sees the numbers move while
 * their child is still practising (§7 step 5) rather than in one jump at the end.
 */
export async function recordAttempt(input: {
  studentId: string;
  exerciseId: string;
  correct: boolean;
}) {
  const db = createServerSupabase();
  const { studentId, exerciseId, correct } = input;

  const { data: exercise } = await db
    .from("exercises")
    .select("id, topic_id, type, vocab_item_id, grammar_point_id, content")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) throw new Error("Không tìm thấy bài tập");

  await db
    .from("exercise_attempts")
    .insert({ student_id: studentId, exercise_id: exerciseId, correct });

  await applyMastery(db, studentId, exercise, correct);
  await refreshTopicProgress(db, studentId, exercise.topic_id);
  const { xp, streak } = await awardXp(db, studentId, xpForAttempt(correct));
  const breakdown = await recomputeLevel(db, studentId);
  const unlocked = await evaluateUnlocks(db, studentId, {
    streak,
    totalXp: xp,
    cefrBand: breakdown.cefrBand,
    bandRank: bandIndex(breakdown.cefrBand),
  });

  revalidatePath("/", "layout");
  return { breakdown, streak, totalXp: xp, unlocked };
}

async function applyMastery(
  db: Db,
  studentId: string,
  exercise: {
    topic_id: string;
    type: string;
    vocab_item_id: string | null;
    grammar_point_id: string | null;
    content: Json;
  },
  correct: boolean,
) {
  const delta = correct ? MASTERY_GAIN : -MASTERY_LOSS;
  const now = new Date().toISOString();

  if (exercise.vocab_item_id) {
    await bumpVocab(db, studentId, [exercise.vocab_item_id], delta, now);
  }

  if (exercise.grammar_point_id) {
    const { data: existing } = await db
      .from("grammar_mastery")
      .select("mastery_score")
      .eq("student_id", studentId)
      .eq("grammar_point_id", exercise.grammar_point_id)
      .maybeSingle();

    await db.from("grammar_mastery").upsert(
      {
        student_id: studentId,
        grammar_point_id: exercise.grammar_point_id,
        mastery_score: clamp(Number(existing?.mastery_score ?? 0) + delta),
        last_reviewed_at: now,
      },
      { onConflict: "student_id,grammar_point_id" },
    );
  }

  // A matching exercise covers several vocab items at once — credit each of
  // the terms it actually contains.
  if (exercise.type === "MATCHING") {
    const content = exercise.content as { pairs?: { left: string }[] };
    const terms = (content.pairs ?? []).map((p) => p.left);
    if (terms.length) {
      const { data: items } = await db
        .from("vocab_items")
        .select("id")
        .eq("topic_id", exercise.topic_id)
        .in("term", terms);
      await bumpVocab(
        db,
        studentId,
        (items ?? []).map((i) => i.id),
        delta,
        now,
      );
    }
  }
}

async function bumpVocab(
  db: Db,
  studentId: string,
  vocabIds: string[],
  delta: number,
  now: string,
) {
  if (vocabIds.length === 0) return;

  const { data: existing } = await db
    .from("vocab_mastery")
    .select("vocab_item_id, mastery_score")
    .eq("student_id", studentId)
    .in("vocab_item_id", vocabIds);

  const current = new Map(
    (existing ?? []).map((r) => [r.vocab_item_id, Number(r.mastery_score)]),
  );

  await db.from("vocab_mastery").upsert(
    vocabIds.map((id) => ({
      student_id: studentId,
      vocab_item_id: id,
      mastery_score: clamp((current.get(id) ?? 0) + delta),
      last_reviewed_at: now,
    })),
    { onConflict: "student_id,vocab_item_id" },
  );
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Coverage for a topic = share of its exercises the student has got right at
 * least once. Derived from real attempts, never set by hand.
 */
async function refreshTopicProgress(db: Db, studentId: string, topicId: string) {
  const { data: exercises } = await db
    .from("exercises")
    .select("id")
    .eq("topic_id", topicId);

  const ids = (exercises ?? []).map((e) => e.id);
  if (ids.length === 0) return;

  const { data: attempts } = await db
    .from("exercise_attempts")
    .select("exercise_id")
    .eq("student_id", studentId)
    .eq("correct", true)
    .in("exercise_id", ids);

  const distinct = new Set((attempts ?? []).map((a) => a.exercise_id));
  const percent = Math.round((distinct.size / ids.length) * 100);

  await db.from("topic_progress").upsert(
    {
      student_id: studentId,
      topic_id: topicId,
      percent_complete: percent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,topic_id" },
  );
}

/** Add XP to today's row and recompute the streak from real practice days. */
async function awardXp(db: Db, studentId: string, amount: number) {
  const today = isoDate();

  const { data: existingToday } = await db
    .from("xp_events")
    .select("xp")
    .eq("student_id", studentId)
    .eq("date", today)
    .maybeSingle();

  const { data: history } = await db
    .from("xp_events")
    .select("date, xp")
    .eq("student_id", studentId)
    .gt("xp", 0);

  const dates = new Set((history ?? []).map((h) => h.date));
  dates.add(today); // today now counts, because they just practised
  const streak = computeStreak(dates, today);

  await db.from("xp_events").upsert(
    {
      student_id: studentId,
      date: today,
      xp: Number(existingToday?.xp ?? 0) + amount,
      streak_count: streak,
    },
    { onConflict: "student_id,date" },
  );

  const totalXp = (history ?? []).reduce(
    (sum, h) => sum + (h.date === today ? 0 : Number(h.xp)),
    0,
  );

  return {
    xp: totalXp + Number(existingToday?.xp ?? 0) + amount,
    streak,
  };
}

/**
 * Accessory unlocks (§13). Rules live on the `avatars` rows, so adding a new
 * unlockable is a row insert rather than a code change.
 */
async function evaluateUnlocks(
  db: Db,
  studentId: string,
  ctx: { streak: number; totalXp: number; cefrBand: string; bandRank: number },
) {
  const [{ data: catalogue }, { data: mine }] = await Promise.all([
    db.from("avatars").select("id, label, image_url, unlock_rule").eq("category", "ACCESSORY"),
    db
      .from("student_avatars")
      .select("unlocked_accessory_ids, equipped_accessory_ids")
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  const already = new Set(
    Array.isArray(mine?.unlocked_accessory_ids)
      ? (mine!.unlocked_accessory_ids as string[])
      : [],
  );

  const newly = (catalogue ?? []).filter(
    (a) => !already.has(a.id) && isUnlocked(a.unlock_rule, ctx),
  );
  if (newly.length === 0) return [];

  const unlockedIds = [...already, ...newly.map((a) => a.id)];
  const equipped = Array.isArray(mine?.equipped_accessory_ids)
    ? (mine!.equipped_accessory_ids as string[])
    : [];

  await db
    .from("student_avatars")
    .update({
      unlocked_accessory_ids: unlockedIds as Json,
      // Auto-equip the first thing a student ever unlocks so the reward is
      // visible immediately rather than hidden behind a menu.
      equipped_accessory_ids: (equipped.length
        ? equipped
        : [newly[0].id]) as Json,
    })
    .eq("student_id", studentId);

  return newly.map((a) => ({
    id: a.id,
    label: a.label,
    emoji: a.image_url,
  }));
}

/**
 * End of a practice round: bank the time on task and pay out gems.
 *
 * Returns the new balance so the completion screen can show a real number
 * rather than assuming the write succeeded.
 */
export async function completePracticeRound(
  studentId: string,
  minutes: number,
) {
  const db = createServerSupabase();
  const safe = Math.max(1, Math.min(180, Math.round(minutes)));

  await db
    .from("study_sessions")
    .insert({ student_id: studentId, minutes: safe });

  const { data: avatar } = await db
    .from("student_avatars")
    .select("gems")
    .eq("student_id", studentId)
    .maybeSingle();

  const gems = Number(avatar?.gems ?? 0) + GEMS_PER_ROUND;
  await db
    .from("student_avatars")
    .update({ gems })
    .eq("student_id", studentId);

  const breakdown = await recomputeLevel(db, studentId);

  revalidatePath("/", "layout");
  return { gems, earnedGems: GEMS_PER_ROUND, breakdown };
}

export async function submitJournal(
  studentId: string,
  topicId: string,
  text: string,
) {
  const db = createServerSupabase();
  const clean = text.trim();
  if (clean.length < 10) {
    throw new Error("Hãy viết ít nhất một vài câu (tối thiểu 10 ký tự)");
  }

  const { error } = await db
    .from("journal_entries")
    .insert({ student_id: studentId, topic_id: topicId, text: clean });
  if (error) throw new Error(error.message);

  const { data: parents } = await db
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", studentId);

  if (parents?.length) {
    await db.from("notifications").insert(
      parents.map((p) => ({
        user_id: p.parent_id,
        type: "CLASS_POST" as const,
        payload: { journalPreview: clean.slice(0, 120) } as Json,
      })),
    );
  }

  revalidatePath("/", "layout");
}

export async function setEquippedAccessories(
  studentId: string,
  accessoryIds: string[],
) {
  const db = createServerSupabase();

  const { data: mine } = await db
    .from("student_avatars")
    .select("unlocked_accessory_ids")
    .eq("student_id", studentId)
    .maybeSingle();

  const unlocked = new Set(
    Array.isArray(mine?.unlocked_accessory_ids)
      ? (mine!.unlocked_accessory_ids as string[])
      : [],
  );

  // Never let a client equip something it has not actually earned.
  const allowed = accessoryIds.filter((id) => unlocked.has(id)).slice(0, 2);

  await db
    .from("student_avatars")
    .update({ equipped_accessory_ids: allowed as Json })
    .eq("student_id", studentId);

  revalidatePath("/", "layout");
}

export async function markNotificationsRead(userId: string) {
  const db = createServerSupabase();
  await db
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  revalidatePath("/", "layout");
}
