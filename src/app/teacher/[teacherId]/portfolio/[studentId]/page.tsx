import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStudentSummary } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { PageHeader } from "@/components/teacher/page-header";
import { StudentPortfolioDetailClient } from "@/components/teacher/student-portfolio-detail-client";

export const dynamic = "force-dynamic";

export default async function StudentPortfolioDetailPage({
  params,
}: PageProps<"/teacher/[teacherId]/portfolio/[studentId]">) {
  const { teacherId, studentId } = await params;

  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  const db = createServerSupabase();
  const [{ data: journals }, { data: speakings }] = await Promise.all([
    db
      .from("journal_entries")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    db
      .from("speaking_attempts")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teacher/${teacherId}/portfolio`}
          className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <StudentAvatar
            seed={student.avatarSeed}
            overrides={student.overrides}
            items={student.items}
            size={44}
          />
          <div>
            <h2 className="text-xl font-bold">{student.name} — Detailed Portfolio</h2>
            <p className="text-xs text-muted-foreground">
              Duyệt bài viết Nhật ký, chấm bài Luyện nói và cho sao đánh giá.
            </p>
          </div>
        </div>
      </div>

      <StudentPortfolioDetailClient
        teacherId={teacherId}
        studentId={studentId}
        journals={journals ?? []}
        speakings={speakings ?? []}
      />
    </div>
  );
}
