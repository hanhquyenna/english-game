"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentOnJournal } from "@/lib/actions/teacher";

export function JournalCommentForm({
  entryId,
  existing,
}: {
  entryId: string;
  existing: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(existing ?? "");
  const [pending, start] = useTransition();

  if (existing && !open) {
    return (
      <div className="mt-2 rounded-md bg-[var(--persona-soft)] p-2.5 text-sm">
        <p className="text-xs font-semibold" style={{ color: "var(--persona)" }}>
          Nhận xét của cô
        </p>
        <p className="mt-0.5">{existing}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 text-xs text-muted-foreground underline"
        >
          Sửa nhận xét
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => setOpen(true)}
      >
        Viết nhận xét
      </Button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await commentOnJournal(entryId, comment);
            toast.success("Đã gửi nhận xét");
            setOpen(false);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Không gửi được nhận xét",
            );
          }
        });
      }}
    >
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Nhận xét ngắn cho học sinh…"
        rows={2}
        maxLength={400}
        aria-label="Nhận xét của giáo viên"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !comment.trim()}>
          {pending ? "Đang gửi…" : "Gửi nhận xét"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setComment(existing ?? "");
            setOpen(false);
          }}
        >
          Huỷ
        </Button>
      </div>
    </form>
  );
}
