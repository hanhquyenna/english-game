"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createLessonPlan(input: {
  teacherId: string;
  topicId?: string | null;
  title: string;
  objectives: string;
  materials: string;
  activities: string;
  homework: string;
}) {
  const db = createServerSupabase();
  const { teacherId, topicId, title, objectives, materials, activities, homework } = input;
  if (!title.trim()) throw new Error("Tiêu đề giáo án không được để trống.");

  await db.from("lesson_plans").insert({
    teacher_id: teacherId,
    topic_id: topicId || null,
    title: title.trim(),
    objectives: objectives.trim(),
    materials: materials.trim(),
    activities: activities.trim(),
    homework: homework.trim(),
  });

  revalidatePath("/teacher/[teacherId]/lesson-plans", "layout");
}
