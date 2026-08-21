"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateNextMastery, type Quality } from "@/lib/sm2";

export async function recordReviewAttempt(input: {
  studentId: string;
  itemId: string;
  itemType: "vocab" | "grammar";
  quality: Quality;
}) {
  const db = createServerSupabase();
  const { studentId, itemId, itemType, quality } = input;
  const now = new Date().toISOString();
  const isRemembered = quality >= 3;
  const nextReviewAt = new Date(
    Date.now() + (isRemembered ? 3 * 86400 * 1000 : 86400 * 1000),
  ).toISOString();

  if (itemType === "vocab") {
    const { data: existing } = await db
      .from("vocab_mastery")
      .select("mastery_score")
      .eq("student_id", studentId)
      .eq("vocab_item_id", itemId)
      .maybeSingle();

    const currentScore = existing ? Number(existing.mastery_score) : 0;
    const nextScore = calculateNextMastery(currentScore, quality);

    await db.from("vocab_mastery").upsert(
      {
        student_id: studentId,
        vocab_item_id: itemId,
        mastery_score: nextScore,
        last_reviewed_at: now,
      },
      { onConflict: "student_id,vocab_item_id" },
    );

    // Also log to vocab_review_log for FRS §6.4 real-time COUNT tracking
    await db.from("vocab_review_log").insert({
      student_id: studentId,
      vocab_id: itemId,
      result: isRemembered ? "remembered" : "forgot",
      next_review_at: nextReviewAt,
    });
  } else {
    const { data: existing } = await db
      .from("grammar_mastery")
      .select("mastery_score")
      .eq("student_id", studentId)
      .eq("grammar_point_id", itemId)
      .maybeSingle();

    const currentScore = existing ? Number(existing.mastery_score) : 0;
    const nextScore = calculateNextMastery(currentScore, quality);

    await db.from("grammar_mastery").upsert(
      {
        student_id: studentId,
        grammar_point_id: itemId,
        mastery_score: nextScore,
        last_reviewed_at: now,
      },
      { onConflict: "student_id,grammar_point_id" },
    );
  }

  revalidatePath("/student/[studentId]/vault", "layout");
}

export async function claimWeeklyReviewBonus(studentId: string) {
  const db = createServerSupabase();
  const BONUS_GEMS = 20;
  const now = new Date();

  const { data: avatar } = await db
    .from("student_avatars")
    .select("gems, last_weekly_bonus_claimed_at, last_vault_review_bonus_at")
    .eq("student_id", studentId)
    .maybeSingle();

  const lastClaimedStr =
    avatar?.last_weekly_bonus_claimed_at ?? avatar?.last_vault_review_bonus_at;

  if (lastClaimedStr) {
    const lastClaimed = new Date(lastClaimedStr);
    const diffDays = (now.getTime() - lastClaimed.getTime()) / (1000 * 3600 * 24);

    if (diffDays < 7) {
      return {
        alreadyClaimed: true,
        gemsEarned: 0,
        message: "Đã nhận thưởng tuần này rồi",
      };
    }
  }

  if (avatar) {
    await db
      .from("student_avatars")
      .update({
        gems: (avatar.gems ?? 0) + BONUS_GEMS,
        last_weekly_bonus_claimed_at: now.toISOString(),
      })
      .eq("student_id", studentId);
  } else {
    await db.from("student_avatars").insert({
      student_id: studentId,
      base_avatar_seed: studentId,
      gems: BONUS_GEMS,
      last_weekly_bonus_claimed_at: now.toISOString(),
    });
  }

  revalidatePath("/student/[studentId]", "layout");
  return {
    alreadyClaimed: false,
    gemsEarned: BONUS_GEMS,
    message: `+${BONUS_GEMS} Gems thưởng tuần đã được cộng vào ví của bạn!`,
  };
}
