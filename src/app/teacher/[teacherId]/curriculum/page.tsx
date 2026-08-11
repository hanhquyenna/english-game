import Link from "next/link";
import {
  getClassForTeacher,
  getTopicContentCounts,
  getTopicsWithProgress,
} from "@/lib/queries";
import { AssignTopicButton } from "@/components/teacher/assign-topic-button";
import { CreateTopicForm } from "@/components/teacher/create-topic-form";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CurriculumPage({
  params,
}: PageProps<"/teacher/[teacherId]/curriculum">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) return <p className="text-muted-foreground">Chưa có lớp nào.</p>;

  const topics = await getTopicsWithProgress(klass.id);
  const counts = await getTopicContentCounts(topics.map((t) => t.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Chương trình lớp {klass.name}</h2>
        <p className="text-sm text-muted-foreground">
          Bài học đã giao sẽ mở khoá cho học sinh luyện tập và được tính vào
          phần “chương trình” trong điểm trình độ.
        </p>
      </div>

      <ul className="space-y-3">
        {topics.map((topic) => {
          const c = counts.get(topic.id) ?? {
            vocab: 0,
            grammar: 0,
            exercises: 0,
          };
          const assigned = Boolean(topic.assigned_at);

          return (
            <li key={topic.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/teacher/${teacherId}/curriculum/${topic.id}`}
                        className="font-semibold hover:underline"
                      >
                        {topic.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          assigned
                            ? "bg-[var(--success)]/12 text-[var(--success)]"
                            : "bg-black/6 text-muted-foreground"
                        }`}
                      >
                        {assigned ? "Đã giao" : "Chưa giao"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.vocab} từ vựng · {c.grammar} điểm ngữ pháp ·{" "}
                      {c.exercises} bài tập
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/${teacherId}/curriculum/${topic.id}`}
                      className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-black/4"
                    >
                      Soạn nội dung
                    </Link>
                    <AssignTopicButton
                      topicId={topic.id}
                      topicTitle={topic.title}
                      assigned={assigned}
                      hasContent={c.exercises > 0}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <CreateTopicForm classId={klass.id} teacherId={teacherId} />
    </div>
  );
}
