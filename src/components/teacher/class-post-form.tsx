"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClassPost } from "@/lib/actions/teacher";

/** Class Story (§13) — ambient visibility for parents beyond the numbers. */
export function ClassPostForm({
  classId,
  teacherId,
}: {
  classId: string;
  teacherId: string;
}) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Đăng thông báo cho lớp</CardTitle>
        <p className="text-sm text-muted-foreground">
          Học sinh và phụ huynh đều nhìn thấy ngay.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              try {
                await createClassPost(classId, teacherId, text);
                toast.success("Đã đăng thông báo");
                setText("");
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Không đăng được",
                );
              }
            });
          }}
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Tuần này lớp mình học Unit 3 – Daily Routine. Các em nhớ luyện tập mỗi ngày nhé!"
            rows={3}
            maxLength={500}
            aria-label="Nội dung thông báo"
          />
          <Button type="submit" disabled={pending || !text.trim()}>
            {pending ? "Đang đăng…" : "Đăng thông báo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
