import { MessageSquare, Megaphone, Award } from "lucide-react";
import { getClassForTeacher } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { KUDOS_LABELS } from "@/lib/personas";
import { ClassPostForm } from "@/components/teacher/class-post-form";
import { JournalCommentForm } from "@/components/teacher/journal-comment-form";
import { EmptyState } from "@/components/teacher/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: PageProps<"/teacher/[teacherId]/story">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) return <p className="text-muted-foreground">Chưa có lớp nào.</p>;

  const db = createServerSupabase();

  const { data: enrolled } = await db
    .from("enrollments")
    .select("users(id, name)")
    .eq("class_id", klass.id);

  const students = (enrolled ?? [])
    .map((e) => e.users)
    .filter((u): u is { id: string; name: string } => Boolean(u));
  const nameById = new Map(students.map((s) => [s.id, s.name]));
  const studentIds = students.map((s) => s.id);

  const [{ data: posts }, { data: kudos }, { data: journals }] =
    await Promise.all([
      db
        .from("class_posts")
        .select("*")
        .eq("class_id", klass.id)
        .order("created_at", { ascending: false })
        .limit(20),
      studentIds.length
        ? db
            .from("kudos")
            .select("*")
            .in("student_id", studentIds)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),
      studentIds.length
        ? db
            .from("journal_entries")
            .select("*")
            .in("student_id", studentIds)
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
    ]);

  const awaitingComment = (journals ?? []).filter((j) => !j.teacher_comment);

  return (
    <div className="space-y-6">
      <ClassPostForm classId={klass.id} teacherId={teacherId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bài viết của học sinh ({(journals ?? []).length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {awaitingComment.length === 0
              ? "Đã nhận xét hết."
              : `${awaitingComment.length} bài chưa có nhận xét.`}{" "}
            Phụ huynh cũng đọc được nhận xét của cô.
          </p>
        </CardHeader>
        <CardContent>
          {(journals ?? []).length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              text="Chưa có bài viết nào. Học sinh viết sau khi hoàn thành một bài học."
            />
          ) : (
            <ul className="space-y-4">
              {(journals ?? []).map((entry) => (
                <li key={entry.id} className="rounded-md border p-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {nameById.get(entry.student_id) ?? "Học sinh"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatWhen(entry.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{entry.text}</p>
                  <JournalCommentForm
                    entryId={entry.id}
                    existing={entry.teacher_comment}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng tin lớp</CardTitle>
        </CardHeader>
        <CardContent>
          {(posts ?? []).length === 0 ? (
            <EmptyState icon={Megaphone} text="Chưa có thông báo nào." />
          ) : (
            <ul className="space-y-3">
              {(posts ?? []).map((post) => (
                <li key={post.id} className="rounded-md border p-3">
                  <p className="text-sm">{post.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatWhen(post.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tuyên dương gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {(kudos ?? []).length === 0 ? (
            <EmptyState icon={Award} text="Chưa tuyên dương ai. Vào trang Lớp học để gửi." />
          ) : (
            <ul className="space-y-2">
              {(kudos ?? []).map((k) => (
                <li
                  key={k.id}
                  className="flex flex-wrap items-baseline gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {nameById.get(k.student_id) ?? "Học sinh"}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--persona-soft)",
                      color: "var(--persona)",
                    }}
                  >
                    {KUDOS_LABELS[k.tag]}
                  </span>
                  {k.note ? (
                    <span className="text-muted-foreground">{k.note}</span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatWhen(k.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
