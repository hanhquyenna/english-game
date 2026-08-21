"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createMaterialFolder(input: {
  classId: string;
  name: string;
}) {
  const db = createServerSupabase();
  const { classId, name } = input;
  if (!name.trim()) throw new Error("Tên thư mục không được để trống.");

  await db.from("material_folders").insert({
    class_id: classId,
    name: name.trim(),
  });

  revalidatePath("/teacher/[teacherId]/materials", "layout");
}

export async function createMaterial(input: {
  classId: string;
  folderId?: string | null;
  title: string;
  fileType: string;
  fileUrl: string;
  topicId?: string | null;
  cefrLevel: string;
}) {
  const db = createServerSupabase();
  const { classId, folderId, title, fileType, fileUrl, topicId, cefrLevel } = input;
  if (!title.trim()) throw new Error("Tiêu đề tài liệu không được để trống.");

  await db.from("materials").insert({
    class_id: classId,
    folder_id: folderId || null,
    title: title.trim(),
    file_type: fileType,
    file_url: fileUrl || "#",
    topic_id: topicId || null,
    cefr_level: cefrLevel,
  });

  revalidatePath("/teacher/[teacherId]/materials", "layout");
}
