"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function sendDirectMessage(input: {
  classId: string;
  teacherId: string;
  studentId: string;
  senderId: string;
  body: string;
}) {
  const db = createServerSupabase();
  const { classId, teacherId, studentId, senderId, body } = input;

  if (!body.trim()) return;

  await db.from("messages").insert({
    class_id: classId,
    teacher_id: teacherId,
    student_id: studentId,
    sender_id: senderId,
    body: body.trim(),
  });

  revalidatePath("/student/[studentId]/inbox", "layout");
}

export async function postClassComment(input: {
  classPostId: string;
  authorId: string;
  body: string;
}) {
  const db = createServerSupabase();
  const { classPostId, authorId, body } = input;

  if (!body.trim()) return;

  await db.from("class_post_comments").insert({
    class_post_id: classPostId,
    author_id: authorId,
    body: body.trim(),
  });

  revalidatePath("/student/[studentId]/inbox", "layout");
}
