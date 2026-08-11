"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createTopic } from "@/lib/actions/teacher";

export function CreateTopicForm({
  classId,
  teacherId,
}: {
  classId: string;
  teacherId: string;
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Card>
      <CardContent className="py-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              try {
                const id = await createTopic(classId, title);
                toast.success("Đã tạo bài học mới");
                setTitle("");
                // Straight into the builder — a unit with no content is not
                // useful yet, so this is where the teacher needs to be next.
                router.push(`/teacher/${teacherId}/curriculum/${id}`);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Không tạo được",
                );
              }
            });
          }}
        >
          <div className="min-w-56 flex-1">
            <label
              htmlFor="new-topic"
              className="mb-1.5 block text-sm font-medium"
            >
              Thêm bài học mới
            </label>
            <Input
              id="new-topic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Unit 4: Food and Drink"
              maxLength={80}
            />
          </div>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? "Đang tạo…" : "Tạo bài học"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
