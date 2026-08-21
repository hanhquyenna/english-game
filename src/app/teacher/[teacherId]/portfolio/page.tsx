import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForTeacher, getRoster } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { PageHeader } from "@/components/teacher/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioClientList } from "@/components/teacher/portfolio-client-list";

export const dynamic = "force-dynamic";

export default async function TeacherPortfolioPage({
  params,
}: PageProps<"/teacher/[teacherId]/portfolio">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) notFound();

  const roster = await getRoster(klass.id);
  const studentIds = roster.map((s) => s.id);

  const db = createServerSupabase();
  const [{ data: journals }, { data: speakings }] = await Promise.all([
    studentIds.length
      ? db
          .from("journal_entries")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? db
          .from("speaking_attempts")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const studentPortfolioMap = roster.map((student) => {
    const studentJournals = (journals ?? []).filter((j) => j.student_id === student.id);
    const studentSpeakings = (speakings ?? []).filter((s) => s.student_id === student.id);

    const pendingCount =
      studentJournals.filter((j) => j.status === "submitted").length +
      studentSpeakings.filter((s) => s.overall_score === null).length;

    return {
      student,
      journals: studentJournals,
      speakings: studentSpeakings,
      pendingCount,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio Học sinh"
        description={`Tổng hợp bài viết Nhật ký và Luyện nói của Lớp ${klass.name}`}
      />

      <PortfolioClientList
        teacherId={teacherId}
        portfolios={studentPortfolioMap}
      />
    </div>
  );
}
