import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { EXERCISE_LABELS } from "@/lib/personas";
import { VocabEditor } from "@/components/teacher/vocab-editor";
import { GrammarEditor } from "@/components/teacher/grammar-editor";
import { ExerciseEditor } from "@/components/teacher/exercise-editor";
import { CreateExamButton } from "@/components/teacher/create-exam-button";
import { AssignTopicButton } from "@/components/teacher/assign-topic-button";
import { PageHeader } from "@/components/teacher/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TopicBuilder({
  params,
}: PageProps<"/teacher/[teacherId]/curriculum/[topicId]">) {
  const { teacherId, topicId } = await params;
  const db = createServerSupabase();

  const { data: topic } = await db
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) notFound();

  const [{ data: vocab }, { data: grammar }, { data: exercises }] =
    await Promise.all([
      db.from("vocab_items").select("*").eq("topic_id", topicId).order("created_at"),
      db.from("grammar_points").select("*").eq("topic_id", topicId).order("created_at"),
      db.from("exercises").select("*").eq("topic_id", topicId).order("created_at"),
    ]);

  const practice = (exercises ?? []).filter((e) => e.type !== "VOCAB_CARD");
  const gradable = (exercises ?? []).filter(
    (e) => e.type === "MCQ" || e.type === "FILL_BLANK",
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/teacher/${teacherId}/curriculum`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Chương trình
        </Link>
        <PageHeader
          title={topic.title}
          description={`${vocab?.length ?? 0} từ vựng · ${grammar?.length ?? 0} điểm ngữ pháp · ${
            exercises?.length ?? 0
          } bài tập${topic.assigned_at ? " · đã giao cho lớp" : " · chưa giao"}`}
          action={
            <>
              <CreateExamButton
                classId={topic.class_id}
                topicId={topic.id}
                topicTitle={topic.title}
                questionCount={gradable.length}
              />
              <AssignTopicButton
                topicId={topic.id}
                topicTitle={topic.title}
                assigned={Boolean(topic.assigned_at)}
                hasContent={(exercises?.length ?? 0) > 0}
              />
            </>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Từ vựng</CardTitle>
        </CardHeader>
        <CardContent>
          <VocabEditor
            topicId={topicId}
            teacherId={teacherId}
            items={vocab ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Điểm ngữ pháp</CardTitle>
        </CardHeader>
        <CardContent>
          <GrammarEditor topicId={topicId} items={grammar ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bài tập luyện ({practice.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseEditor
            topicId={topicId}
            teacherId={teacherId}
            grammarPoints={(grammar ?? []).map((g) => ({
              id: g.id,
              name: g.name,
            }))}
            exercises={practice.map((e) => ({
              id: e.id,
              type: e.type,
              typeLabel: EXERCISE_LABELS[e.type],
              content: e.content as Record<string, unknown>,
            }))}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Mỗi từ vựng ở trên tự động có một thẻ học ({vocab?.length ?? 0} thẻ),
            nên không cần tạo tay.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
