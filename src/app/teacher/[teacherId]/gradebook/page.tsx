import { ClipboardCheck } from "lucide-react";
import { getClassForTeacher } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { GradeRow } from "@/components/teacher/grade-row";
import { EmptyState } from "@/components/teacher/empty-state";
import { PageHeader } from "@/components/teacher/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function GradebookPage({
  params,
}: PageProps<"/teacher/[teacherId]/gradebook">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) return <p className="text-muted-foreground">Chưa có lớp nào.</p>;

  const db = createServerSupabase();

  const [{ data: exams }, { data: roster }] = await Promise.all([
    db
      .from("exams")
      .select("*")
      .eq("class_id", klass.id)
      .order("created_at", { ascending: false }),
    db.from("enrollments").select("users(id, name)").eq("class_id", klass.id),
  ]);

  const students = (roster ?? [])
    .map((r) => r.users)
    .filter((u): u is { id: string; name: string } => Boolean(u));

  const { data: submissions } = await db
    .from("submissions")
    .select("*")
    .in("exam_id", (exams ?? []).map((e) => e.id).concat("00000000-0000-0000-0000-000000000000"));

  const byExam = new Map<string, typeof submissions>();
  for (const s of submissions ?? []) {
    const list = byExam.get(s.exam_id) ?? [];
    list.push(s);
    byExam.set(s.exam_id, list);
  }

  const ungradedTotal = (submissions ?? []).filter((s) => s.score === null).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chấm bài"
        description={`${
          ungradedTotal === 0
            ? "Không còn bài nào chờ chấm."
            : `${ungradedTotal} bài đang chờ chấm.`
        } Chấm xong sẽ cập nhật ngay điểm trình độ của học sinh và báo cho phụ huynh.`}
      />

      {(exams ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            text="Chưa có đề kiểm tra nào. Vào một bài học trong Chương trình và bấm “Tạo đề”."
          />
        </Card>
      ) : null}

      {(exams ?? []).map((exam) => {
        const subs = byExam.get(exam.id) ?? [];
        const questionCount = Array.isArray(exam.exercise_ids)
          ? exam.exercise_ids.length
          : 0;
        const notSubmitted = students.filter(
          (s) => !subs.some((sub) => sub.student_id === s.id),
        );

        return (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle className="text-base">{exam.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {questionCount} câu · {subs.length}/{students.length} đã nộp
                {exam.published_at ? " · đã phát hành" : " · chưa phát hành"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {subs.length === 0 ? (
                <EmptyState text="Chưa có học sinh nào nộp bài." />
              ) : (
                <ul className="divide-y rounded-md border">
                  {subs.map((sub) => (
                    <GradeRow
                      key={sub.id}
                      submissionId={sub.id}
                      studentName={
                        students.find((s) => s.id === sub.student_id)?.name ??
                        "Học sinh"
                      }
                      score={sub.score === null ? null : Number(sub.score)}
                      canAutoScore={questionCount > 0}
                    />
                  ))}
                </ul>
              )}

              {notSubmitted.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Chưa nộp: {notSubmitted.map((s) => s.name).join(", ")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
