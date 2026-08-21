import { notFound } from "next/navigation";
import { getClassForTeacher, getTopicsWithProgress, getUser } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  LessonPlansClient,
  type LessonPlanData,
} from "@/components/teacher/lesson-plans-client";

export const dynamic = "force-dynamic";

export default async function LessonPlansPage({
  params,
}: PageProps<"/teacher/[teacherId]/lesson-plans">) {
  const { teacherId } = await params;
  const [teacher, klass] = await Promise.all([
    getUser(teacherId),
    getClassForTeacher(teacherId),
  ]);
  if (!teacher || !klass) notFound();

  const db = createServerSupabase();
  const [topicsRaw, { data: plansRaw }] = await Promise.all([
    getTopicsWithProgress(klass.id),
    db
      .from("lesson_plans")
      .select("*, topics(title)")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false }),
  ]);

  const lessonPlans: LessonPlanData[] = (plansRaw ?? []).map((p) => ({
    id: p.id,
    // @ts-expect-error Supabase joined column
    topicTitle: p.topics?.title ?? null,
    title: p.title,
    objectives: p.objectives,
    materials: p.materials,
    activities: p.activities,
    homework: p.homework,
    createdAt: p.created_at,
  }));

  const topics = topicsRaw.map((t) => ({ id: t.id, title: t.title }));

  return (
    <LessonPlansClient
      teacherId={teacherId}
      teacherName={teacher.name}
      className={klass.name}
      topics={topics}
      lessonPlans={lessonPlans}
    />
  );
}
