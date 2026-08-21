"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { recomputeLevel } from "@/lib/level-service";
import {
  canClaimStoryPageReward,
  calculatePetStage,
  matchKeywordHints,
} from "@/lib/game-loop";

/**
 * Shared reward function to award gems & XP across C1 - C5.
 * Logs to `xp_ledger` and updates `users.gems`.
 */
export async function awardGameReward(input: {
  studentId: string;
  gems: number;
  xp: number;
  source: string;
  refId?: string;
}) {
  const db = createServerSupabase();
  const { studentId, gems, xp, source, refId } = input;

  if (xp > 0) {
    await db.from("xp_ledger").insert({
      student_id: studentId,
      source: source as any,
      amount: xp,
      ref_id: refId ?? null,
    });
  }

  if (gems > 0) {
    const { data: user } = await (db as any)
      .from("users")
      .select("gems")
      .eq("id", studentId)
      .single();

    const currentGems = Number((user as any)?.gems ?? 0);
    await (db as any)
      .from("users")
      .update({ gems: currentGems + gems })
      .eq("id", studentId);
  }

  await recomputeLevel(db, studentId);
  revalidatePath("/", "layout");
  return { success: true, gemsAwarded: gems, xpAwarded: xp };
}

/** C1: AI Role Play Actions */

export async function startRolePlaySession(studentId: string, topicId: string) {
  const db = createServerSupabase();

  const { data, error } = await (db as any)
    .from("role_play_sessions")
    .insert({
      student_id: studentId,
      topic_id: topicId,
      status: "in_progress",
      reward_gems: 30,
      reward_xp: 50,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Không thể khởi tạo phiên Role Play: " + (error?.message ?? ""));
  }

  revalidatePath("/", "layout");
  return data;
}

export async function submitRolePlayUtterance(input: {
  sessionId: string;
  studentId: string;
  transcript: string;
  audioUrl?: string;
}) {
  const db = createServerSupabase();
  const { sessionId, studentId, transcript, audioUrl } = input;

  const { data: session } = await (db as any)
    .from("role_play_sessions")
    .select("id, topic_id, status")
    .eq("id", sessionId)
    .single();

  if (!session || session.status !== "in_progress") {
    throw new Error("Phiên làm việc đã kết thúc hoặc không tồn tại");
  }

  // Fetch tasks for topic
  const { data: tasks } = await (db as any)
    .from("role_play_tasks")
    .select("id, order, prompt_vi, keyword_hints")
    .eq("topic_id", session.topic_id)
    .order("order");

  // Fetch already completed tasks for this session
  const { data: completions } = await (db as any)
    .from("role_play_task_completions")
    .select("task_id")
    .eq("session_id", sessionId);

  const completedTaskIds = new Set((completions ?? []).map((c: any) => c.task_id));

  let matchedTaskId: string | null = null;
  let matchedKeyword: string | null = null;

  // Check transcript against incomplete tasks
  for (const task of (tasks as any[]) ?? []) {
    if (completedTaskIds.has(task.id)) continue;
    const match = matchKeywordHints(transcript, task.keyword_hints);
    if (match) {
      matchedTaskId = task.id;
      matchedKeyword = match;
      break;
    }
  }

  // Insert utterance
  await (db as any).from("role_play_utterances").insert({
    session_id: sessionId,
    task_id: matchedTaskId,
    audio_url: audioUrl ?? null,
    transcript,
  });

  if (matchedTaskId && matchedKeyword) {
    await (db as any).from("role_play_task_completions").insert({
      session_id: sessionId,
      task_id: matchedTaskId,
      matched_keyword: matchedKeyword,
    });
    completedTaskIds.add(matchedTaskId);
  }

  const allCompleted = ((tasks as any[]) ?? []).length > 0 && completedTaskIds.size >= ((tasks as any[]) ?? []).length;

  if (allCompleted) {
    await (db as any)
      .from("role_play_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    await awardGameReward({
      studentId,
      gems: 30,
      xp: 50,
      source: "speaking_graded",
      refId: sessionId,
    });
  }

  revalidatePath("/", "layout");
  return {
    matchedTaskId,
    matchedKeyword,
    completedCount: completedTaskIds.size,
    totalTasks: ((tasks as any[]) ?? []).length,
    isCompleted: allCompleted,
  };
}

export async function abandonRolePlaySession(sessionId: string) {
  const db = createServerSupabase();
  await (db as any)
    .from("role_play_sessions")
    .update({ status: "abandoned" })
    .eq("id", sessionId);
  revalidatePath("/", "layout");
}

/** C2: Active Practice Actions */

export async function getMistakeBank(studentId: string) {
  const db = createServerSupabase();

  // Find incorrect attempts for student that are not yet resolved
  const { data: attempts } = await db
    .from("exercise_attempts")
    .select("exercise_id, created_at")
    .eq("student_id", studentId)
    .eq("correct", false)
    .order("created_at", { ascending: false });

  const attemptList = (attempts as any[]) ?? [];
  if (attemptList.length === 0) return [];

  // Filter out already resolved items
  const { data: resolvedItems } = await (db as any)
    .from("practice_session_items")
    .select("exercise_id")
    .eq("resolved", true);

  const resolvedSet = new Set((resolvedItems ?? []).map((r: any) => r.exercise_id));
  const uniqueMistakeExerciseIds = [
    ...new Set(attemptList.map((a: any) => a.exercise_id)),
  ].filter((id) => !resolvedSet.has(id)).slice(0, 15);

  if (uniqueMistakeExerciseIds.length === 0) return [];

  const { data: exercises } = await db
    .from("exercises")
    .select("id, topic_id, type, content, skill_tag" as any)
    .in("id", uniqueMistakeExerciseIds);

  return (exercises as any[]) ?? [];
}

export async function getSkillStarsData(studentId: string) {
  const db = createServerSupabase();

  const { data: attempts } = await db
    .from("exercise_attempts")
    .select("exercise_id, correct, created_at, exercises(skill_tag)" as any)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(200);

  const formattedAttempts = (attempts ?? []).map((a: any) => ({
    skillTag: a.exercises?.skill_tag ?? "tu_vung",
    correct: a.correct,
  }));

  return formattedAttempts;
}

export async function createPracticeSession(input: {
  studentId: string;
  mode: "mistake_review" | "skill_boost";
  skillTags?: string[];
}) {
  const db = createServerSupabase();
  const { studentId, mode, skillTags = [] } = input;

  let exercisesToInclude: { id: string }[] = [];

  if (mode === "mistake_review") {
    exercisesToInclude = await getMistakeBank(studentId);
  } else {
    // Select exercises matching skillTags
    const { data: matched } = await db
      .from("exercises")
      .select("id")
      .in("skill_tag" as any, skillTags.length > 0 ? skillTags : ["tu_vung"])
      .limit(15);

    exercisesToInclude = (matched as any[]) ?? [];
  }

  const { data: session, error } = await (db as any)
    .from("practice_sessions")
    .insert({
      student_id: studentId,
      mode,
      skill_tags: skillTags,
      question_count: exercisesToInclude.length,
      estimated_minutes: Math.max(2, Math.ceil(exercisesToInclude.length * 0.8)),
      reward_gems: mode === "mistake_review" ? 50 : 40,
      reward_xp: mode === "mistake_review" ? 60 : 50,
    })
    .select()
    .single();

  if (error || !session) throw new Error("Không thể tạo phiên ôn luyện");

  if (exercisesToInclude.length > 0) {
    const itemsToInsert = exercisesToInclude.map((ex, index) => ({
      session_id: session.id,
      exercise_id: ex.id,
      order: index + 1,
      resolved: false,
    }));
    await (db as any).from("practice_session_items").insert(itemsToInsert);
  }

  revalidatePath("/", "layout");
  return session;
}

export async function markPracticeItemResolved(input: {
  sessionId: string;
  exerciseId: string;
  correct: boolean;
  studentId: string;
}) {
  const db = createServerSupabase();
  const { sessionId, exerciseId, correct, studentId } = input;

  if (correct) {
    await (db as any)
      .from("practice_session_items")
      .update({ resolved: true })
      .eq("session_id", sessionId)
      .eq("exercise_id", exerciseId);
  }

  // Check if session completed
  const { data: items } = await (db as any)
    .from("practice_session_items")
    .select("resolved")
    .eq("session_id", sessionId);

  const allResolved = (items ?? []).length > 0 && (items as any[])?.every((i) => i.resolved);

  if (allResolved) {
    await (db as any)
      .from("practice_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    await awardGameReward({
      studentId,
      gems: 40,
      xp: 50,
      source: "lesson_first",
      refId: sessionId,
    });
  }

  revalidatePath("/", "layout");
  return { allResolved };
}

/** C3: Interactive Story Library Actions */

export async function claimStoryPageReward(input: {
  studentId: string;
  storyId: string;
  pageId: string;
}) {
  const db = createServerSupabase();
  const { studentId, storyId, pageId } = input;

  // Check if student read this page today
  const { data: existingReads } = await (db as any)
    .from("story_reads")
    .select("read_at, reward_claimed")
    .eq("student_id", studentId)
    .eq("story_id", storyId)
    .eq("page_id", pageId)
    .order("read_at", { ascending: false })
    .limit(1);

  const lastRead = (existingReads as any[])?.[0];
  const canClaim = canClaimStoryPageReward(lastRead?.read_at);

  await (db as any).from("story_reads").insert({
    student_id: studentId,
    story_id: storyId,
    page_id: pageId,
    reward_claimed: canClaim,
  });

  if (canClaim) {
    await awardGameReward({
      studentId,
      gems: 1,
      xp: 5,
      source: "lesson_first",
      refId: pageId,
    });
    return { success: true, gemsAwarded: 1, message: "Đã nhận +1 gem cho trang này!" };
  }

  return { success: false, gemsAwarded: 0, message: "Trang này bạn đã nhận thưởng hôm nay rồi!" };
}

/** C5: Buddy Pet Actions */

export async function getOrCreateStudentPet(studentId: string) {
  const db = createServerSupabase();

  const { data: user } = await (db as any)
    .from("users")
    .select("streak_count")
    .eq("id", studentId)
    .single();

  const streak = (user as any)?.streak_count ?? 0;

  const { data: existingPet } = await (db as any)
    .from("student_pets")
    .select("id, species_id, stage, happiness, last_fed_at")
    .eq("student_id", studentId)
    .maybeSingle();

  const calculatedStage = calculatePetStage(streak);

  if (existingPet) {
    if (existingPet.stage !== calculatedStage) {
      await (db as any)
        .from("student_pets")
        .update({ stage: calculatedStage })
        .eq("id", existingPet.id);
    }
    return { ...existingPet, stage: Math.max(existingPet.stage, calculatedStage), streak };
  }

  // Get default species
  const { data: species } = await (db as any)
    .from("pet_species")
    .select("id")
    .limit(1)
    .single();

  const speciesId = species?.id ?? "50000000-0000-0000-0000-000000000001";

  const { data: newPet } = await (db as any)
    .from("student_pets")
    .insert({
      student_id: studentId,
      species_id: speciesId,
      stage: calculatedStage,
      happiness: 80,
    })
    .select()
    .single();

  return { ...newPet, streak };
}

export async function feedPet(studentId: string, petId: string, gemCost = 5) {
  const db = createServerSupabase();

  // Check student gems
  const { data: user } = await (db as any)
    .from("users")
    .select("gems")
    .eq("id", studentId)
    .single();

  const currentGems = Number((user as any)?.gems ?? 0);
  if (currentGems < gemCost) {
    return { success: false, message: "Bạn không đủ gem để cho bé ăn!" };
  }

  // Check feeding limit today (max 3 times/day)
  const { data: pet } = await (db as any)
    .from("student_pets")
    .select("happiness, last_fed_at")
    .eq("id", petId)
    .single();

  if (!pet) return { success: false, message: "Không tìm thấy thú cưng" };

  // Update gems and pet happiness
  await (db as any)
    .from("users")
    .update({ gems: currentGems - gemCost })
    .eq("id", studentId);

  const newHappiness = Math.min(100, (pet.happiness ?? 80) + 10);
  await (db as any)
    .from("student_pets")
    .update({
      happiness: newHappiness,
      last_fed_at: new Date().toISOString(),
    })
    .eq("id", petId);

  revalidatePath("/", "layout");
  return { success: true, newHappiness, remainingGems: currentGems - gemCost };
}
