"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { giveKudos } from "@/lib/actions/teacher";
import { KUDOS_LABELS } from "@/lib/personas";
import type { Enums } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const TAGS: Enums<"kudos_tag">[] = [
  "HARD_WORK",
  "TEAMWORK",
  "PERSISTENCE",
  "ON_TASK",
  "CUSTOM",
];

/**
 * Kudos (§6 teacher 5) — a lightweight daily tool that sits beside grading
 * rather than inside it. Notifies the student and their parents immediately.
 */
export function KudosButton({
  studentId,
  studentName,
  teacherId,
}: {
  studentId: string;
  studentName: string;
  teacherId: string;
}) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<Enums<"kudos_tag">>("HARD_WORK");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Base UI composes via `render`, not Radix's `asChild`. */}
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        ⭐ Tuyên dương
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tuyên dương {studentName}</DialogTitle>
          <DialogDescription>
            Học sinh và phụ huynh sẽ nhận được thông báo ngay lập tức.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Loại tuyên dương</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    tag === t
                      ? "border-[var(--persona)] bg-[var(--persona)] text-white"
                      : "hover:bg-black/4",
                  )}
                >
                  {KUDOS_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor={`note-${studentId}`} className="mb-2 block">
              Ghi chú (không bắt buộc)
            </Label>
            <Input
              id={`note-${studentId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Học đều 12 ngày liên tiếp!"
              maxLength={140}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await giveKudos(studentId, teacherId, tag, note);
                  toast.success(`Đã gửi tuyên dương cho ${studentName}`);
                  setNote("");
                  setOpen(false);
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Không gửi được",
                  );
                }
              })
            }
          >
            {pending ? "Đang gửi…" : "Gửi tuyên dương"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
