import { notFound } from "next/navigation";
import { getClassForTeacher, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  MaterialsClient,
  type MaterialData,
  type MaterialFolderData,
} from "@/components/teacher/materials-client";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({
  params,
}: PageProps<"/teacher/[teacherId]/materials">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) notFound();

  const db = createServerSupabase();

  const [{ data: foldersRaw }, { data: materialsRaw }, topicsRaw] =
    await Promise.all([
      db
        .from("material_folders")
        .select("*")
        .eq("class_id", klass.id)
        .order("name"),
      db
        .from("materials")
        .select("*, topics(title)")
        .eq("class_id", klass.id)
        .order("created_at", { ascending: false }),
      getTopicsWithProgress(klass.id),
    ]);

  const materials: MaterialData[] = (materialsRaw ?? []).map((m) => ({
    id: m.id,
    folderId: m.folder_id,
    title: m.title,
    fileType: m.file_type,
    fileUrl: m.file_url,
    // @ts-expect-error Supabase joined column
    topicTitle: m.topics?.title ?? null,
    cefrLevel: m.cefr_level,
    createdAt: m.created_at,
  }));

  const folderCountMap = new Map<string, number>();
  for (const m of materials) {
    if (m.folderId) {
      folderCountMap.set(m.folderId, (folderCountMap.get(m.folderId) ?? 0) + 1);
    }
  }

  const folders: MaterialFolderData[] = (foldersRaw ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    count: folderCountMap.get(f.id) ?? 0,
  }));

  const topics = topicsRaw.map((t) => ({ id: t.id, title: t.title }));

  return (
    <MaterialsClient
      teacherId={teacherId}
      classId={klass.id}
      folders={folders}
      materials={materials}
      topics={topics}
    />
  );
}
