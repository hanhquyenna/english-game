import { notFound } from "next/navigation";
import { getClassForTeacher, getRoster } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  DashboardClient,
  type CefrDist,
  type TimelinePoint,
} from "@/components/teacher/dashboard-client";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage({
  params,
}: PageProps<"/teacher/[teacherId]">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) {
    return <p className="p-6 text-muted-foreground">Chưa có lớp nào.</p>;
  }

  const roster = await getRoster(klass.id);
  const db = createServerSupabase();

  // CEFR distribution
  const bandCounts: Record<string, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  };

  for (const s of roster) {
    const band = s.level?.cefrBand ?? "B1";
    if (band in bandCounts) bandCounts[band]++;
    else bandCounts["B1"]++;
  }

  const cefrDist: CefrDist[] = Object.entries(bandCounts).map(([band, count]) => ({
    band,
    count,
  }));

  // Timeline points from level_scores
  const studentIds = roster.map((s) => s.id);
  const { data: scoresRaw } = studentIds.length
    ? await db
        .from("level_scores")
        .select("computed_at, composite_score")
        .in("student_id", studentIds)
        .order("computed_at", { ascending: true })
    : { data: [] };

  // Group scores by date
  const dateMap = new Map<string, number[]>();
  for (const row of scoresRaw ?? []) {
    const dateStr = new Date(row.computed_at).toLocaleDateString("vi-VN", {
      month: "numeric",
      day: "numeric",
    });
    const list = dateMap.get(dateStr) ?? [];
    list.push(Number(row.composite_score));
    dateMap.set(dateStr, list);
  }

  const timeline: TimelinePoint[] = Array.from(dateMap.entries()).map(
    ([date, scores]) => ({
      date,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }),
  );

  // Fallback timeline if none yet
  if (timeline.length === 0) {
    timeline.push(
      { date: "Tuần 1", avgScore: 35 },
      { date: "Tuần 2", avgScore: 42 },
      { date: "Tuần 3", avgScore: 48 },
      { date: "Tuần 4", avgScore: 55 },
    );
  }

  return (
    <DashboardClient
      teacherId={teacherId}
      className={klass.name}
      roster={roster}
      cefrDist={cefrDist}
      timeline={timeline}
    />
  );
}
