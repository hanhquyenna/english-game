import { notFound } from "next/navigation";
import { Clock, BookOpen, FileCheck } from "lucide-react";
import { getClassForTeacher } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/teacher/empty-state";
import { PageHeader } from "@/components/teacher/page-header";

export const dynamic = "force-dynamic";

export default async function AssignmentHistoryPage({
  params,
}: PageProps<"/teacher/[teacherId]/assignments/history">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) notFound();

  const db = createServerSupabase();

  const [{ data: topicsRaw }, { data: examsRaw }] = await Promise.all([
    db
      .from("topics")
      .select("id, title, assigned_at")
      .eq("class_id", klass.id)
      .not("assigned_at", "is", null)
      .order("assigned_at", { ascending: false }),
    db
      .from("exams")
      .select("id, title, published_at")
      .eq("class_id", klass.id)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  type HistoryEvent = {
    id: string;
    type: "TOPIC" | "EXAM";
    title: string;
    date: string;
  };

  const events: HistoryEvent[] = [
    ...(topicsRaw ?? []).map((t) => ({
      id: `topic-${t.id}`,
      type: "TOPIC" as const,
      title: `Đã giao bài học: ${t.title}`,
      date: t.assigned_at!,
    })),
    ...(examsRaw ?? []).map((e) => ({
      id: `exam-${e.id}`,
      type: "EXAM" as const,
      title: `Đã xuất bản đề thi: ${e.title}`,
      date: e.published_at!,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử giao bài"
        description={`Nhật ký thời gian thực các sự kiện giao bài học và xuất bản đề thi cho lớp ${klass.name}.`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="size-5 text-[var(--persona)]" />
            Nhật ký giao bài ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState icon={Clock} text="Chưa có lịch sử giao bài nào." />
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
              {events.map((event) => (
                <div key={event.id} className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 size-4 rounded-full border-2 border-white bg-[var(--persona)]" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      {event.type === "TOPIC" ? (
                        <BookOpen size={16} className="text-[var(--persona)] shrink-0" />
                      ) : (
                        <FileCheck size={16} className="text-emerald-600 shrink-0" />
                      )}
                      <p className="font-semibold text-sm">{event.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {event.type === "TOPIC" ? "Bài học" : "Đề thi"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
