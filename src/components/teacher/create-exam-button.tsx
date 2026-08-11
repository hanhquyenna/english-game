"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createExam } from "@/lib/actions/teacher";

/** Builds an exam from the topic's gradable questions and publishes it. */
export function CreateExamButton({
  classId,
  topicId,
  topicTitle,
  questionCount,
}: {
  classId: string;
  topicId: string;
  topicTitle: string;
  questionCount: number;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending || questionCount === 0}
      title={
        questionCount === 0
          ? "Cần ít nhất một câu trắc nghiệm hoặc điền từ"
          : `Tạo đề từ ${questionCount} câu hỏi`
      }
      onClick={() =>
        start(async () => {
          try {
            await createExam(classId, topicId, `Kiểm tra ${topicTitle}`);
            toast.success(`Đã tạo và giao đề từ ${questionCount} câu hỏi`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không tạo được đề");
          }
        })
      }
    >
      {pending ? "Đang tạo đề…" : `📝 Tạo đề (${questionCount} câu)`}
    </Button>
  );
}
