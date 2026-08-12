import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClassForStudent,
  getStudentSummary,
  getTopicContentCounts,
  getTopicsWithProgress,
} from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildLessonPath } from "@/lib/lesson-path";
import { LevelBar } from "@/components/level-bar";
import { WeakestHint } from "@/components/level-breakdown";
import { LessonNode } from "@/components/student/lesson-node";
import { Card, CardContent } from "@/components/ui/card";
import { formatWhen } from "@/lib/format";
import { KUDOS_LABELS } from "@/lib/personas";

export const dynamic = "force-dynamic";

export default async function LessonPathPage({
  params,
}: PageProps<"/student/[studentId]">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student) notFound();

  const topics = klass ? await getTopicsWithProgress(klass.id, studentId) : [];
  const path = buildLessonPath(topics);
  const counts = await getTopicContentCounts(path.map((n) => n.topic.id));

  const db = createServerSupabase();
  const [{ data: posts }, { data: kudos }] = await Promise.all([
    klass
      ? db
          .from("class_posts")
          .select("*")
          .eq("class_id", klass.id)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    db
      .from("kudos")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="space-y-6">
      {student.level ? (
        <Card className="animate-rise">
          <CardContent className="space-y-3 py-5">
            <LevelBar level={student.level} size="lg" />
            <WeakestHint level={student.level} />
          </CardContent>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Đường học của em</h2>

        {path.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-4xl" aria-hidden>
                🌱
              </p>
              <p className="mt-2 font-medium">Chưa có bài học nào được giao</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Khi cô giáo giao bài, bài học sẽ xuất hiện ngay tại đây.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ol className="relative space-y-4">
            {path.map((node, i) => (
              <LessonNode
                key={node.topic.id}
                studentId={studentId}
                node={node}
                index={i}
                exerciseCount={counts.get(node.topic.id)?.exercises ?? 0}
                isLast={i === path.length - 1}
              />
            ))}
          </ol>
        )}
      </section>

      {(kudos ?? []).length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Cô khen em</h2>
          <ul className="space-y-2">
            {(kudos ?? []).map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-baseline gap-2 rounded-xl border bg-card px-4 py-3 text-sm"
              >
                <span aria-hidden>⭐</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: "var(--persona-soft)",
                    color: "var(--persona)",
                  }}
                >
                  {KUDOS_LABELS[k.tag]}
                </span>
                {k.note ? <span>{k.note}</span> : null}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatWhen(k.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(posts ?? []).length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Bảng tin lớp</h2>
          <ul className="space-y-2">
            {(posts ?? []).map((p) => (
              <li key={p.id} className="rounded-xl border bg-card px-4 py-3">
                <p className="text-sm">{p.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatWhen(p.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        <Link href={`/student/${studentId}/profile`} className="underline">
          Xem hồ sơ và bài viết của em →
        </Link>
      </p>
    </div>
  );
}
