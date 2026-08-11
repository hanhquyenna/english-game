"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assignTopic, unassignTopic } from "@/lib/actions/teacher";

/**
 * §7 step 2. Assigning writes `topics.assigned_at`, notifies every student and
 * their parents, and recomputes the class's levels — the coverage denominator
 * changes the moment a unit is assigned.
 */
export function AssignTopicButton({
  topicId,
  topicTitle,
  assigned,
  hasContent,
}: {
  topicId: string;
  topicTitle: string;
  assigned: boolean;
  hasContent: boolean;
}) {
  const [pending, start] = useTransition();

  if (assigned) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              await unassignTopic(topicId);
              toast.success(`Đã thu hồi ${topicTitle}`);
            } catch (e) {
              toast.error(
                e instanceof Error ? e.message : "Không thu hồi được",
              );
            }
          })
        }
      >
        {pending ? "Đang thu hồi…" : "Thu hồi"}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      disabled={pending || !hasContent}
      title={
        hasContent
          ? undefined
          : "Bài học chưa có bài tập nào — thêm nội dung trước khi giao"
      }
      onClick={() =>
        start(async () => {
          try {
            await assignTopic(topicId);
            toast.success(`Đã giao ${topicTitle} cho cả lớp`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không giao được");
          }
        })
      }
    >
      {pending ? "Đang giao…" : "Giao cho lớp"}
    </Button>
  );
}
