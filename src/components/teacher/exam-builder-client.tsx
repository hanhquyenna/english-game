"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillBadge } from "@/components/teacher/badges";
import { EmptyState } from "@/components/teacher/empty-state";
import { PageHeader } from "@/components/teacher/page-header";
import { createExam } from "@/lib/actions/teacher";

export type ExerciseBankItem = {
  id: string;
  topicId: string;
  topicTitle: string;
  type: string;
  skill: string;
  promptOrTerm: string;
};

export function ExamBuilderClient({
  teacherId,
  classId,
  topics,
  exerciseBank,
}: {
  teacherId: string;
  classId: string;
  topics: { id: string; title: string }[];
  exerciseBank: ExerciseBankItem[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<string>(topics[0]?.id ?? "");
  const [examTitle, setExamTitle] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const filteredBank = exerciseBank.filter((e) => !selectedTopic || e.topicId === selectedTopic);

  function toggleExercise(id: string) {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaveExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examTitle.trim() || selectedExerciseIds.size === 0) return;

    start(async () => {
      try {
        await createExam(classId, examTitle.trim(), selectedTopic || null, Array.from(selectedExerciseIds));
        toast.success(`Đã tạo đề thi "${examTitle}" với ${selectedExerciseIds.size} câu hỏi`);
        setExamTitle("");
        setSelectedExerciseIds(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tạo đề thi thất bại");
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soạn đề thi và kiểm tra"
        description="Chọn câu hỏi từ ngân hàng bài tập để tổng hợp thành bài kiểm tra mới."
      />

      <form onSubmit={handleSaveExam} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Thông tin đề thi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="exam-title">Tên đề kiểm tra</Label>
              <Input
                id="exam-title"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: Bài kiểm tra tổng hợp Unit 1 & 2"
              />
            </div>
            <div>
              <Label htmlFor="exam-topic">Chủ đề chính</Label>
              <Select
                value={selectedTopic || "all"}
                onValueChange={(v) => setSelectedTopic(v === "all" || !v ? "" : v)}
              >
                <SelectTrigger id="exam-topic" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả bài học</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Ngân hàng câu hỏi ({filteredBank.length})
              </CardTitle>
              <CardDescription>
                Đã chọn {selectedExerciseIds.size} câu hỏi cho đề thi
              </CardDescription>
            </div>
            <Button
              type="submit"
              disabled={pending || !examTitle.trim() || selectedExerciseIds.size === 0}
              className="gap-1.5 bg-[var(--persona)] text-white hover:opacity-90"
            >
              <Save size={15} /> Lưu đề thi ({selectedExerciseIds.size})
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredBank.length === 0 ? (
              <EmptyState icon={Search} text="Không tìm thấy câu hỏi nào trong ngân hàng." />
            ) : (
              filteredBank.map((item) => {
                const selected = selectedExerciseIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleExercise(item.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-all ${
                      selected ? "border-2 border-[var(--persona)] bg-[var(--persona-soft)]" : "hover:border-[var(--persona-border)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox checked={selected} onCheckedChange={() => {}} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.promptOrTerm}</p>
                        <p className="text-xs text-muted-foreground">Bài học: {item.topicTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SkillBadge skill={item.skill} />
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        {item.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
