"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitJournal } from "@/lib/actions/student";
import { UNLOCK_THRESHOLD } from "@/lib/lesson-path";

/**
 * Journal entry (§6 student 7, §13). Offered after practice as optional extra
 * writing — real work the teacher can comment on and the parent can read, not
 * another score.
 */
export function JournalPrompt({
  studentId,
  topicId,
  topicTitle,
  startingPercent,
}: {
  studentId: string;
  topicId: string;
  topicTitle: string;
  startingPercent: number;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  // Only worth offering once the student has actually engaged with the unit.
  if (startingPercent < UNLOCK_THRESHOLD && !open) return null;

  if (sent) {
    return (
      <div className="rounded-xl border bg-[var(--persona-soft)] p-4 text-left">
        <p className="font-semibold" style={{ color: "var(--persona)" }}>
          Sent to your teacher ✍️
        </p>
        <p className="mt-1 text-sm">
          Your teacher will read it and reply. Your parents can see it too.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed p-4 text-left transition-colors hover:bg-[var(--persona-soft)]"
      >
        <p className="font-semibold">✍️ Write a few sentences about {topicTitle}?</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Optional — but your teacher will read it and comment.
        </p>
      </button>
    );
  }

  return (
    <form
      className="space-y-2 rounded-xl border p-4 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await submitJournal(studentId, topicId, text);
            setSent(true);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Could not send your writing",
            );
          }
        });
      }}
    >
      <label htmlFor="journal" className="block text-sm font-medium">
        Write in English about {topicTitle}
      </label>
      <Textarea
        id="journal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={1200}
        placeholder="Every morning I wake up at six o'clock. Then I…"
        autoFocus
      />
      <p className="text-xs text-muted-foreground">
        {text.trim().length}/10 characters minimum
      </p>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || text.trim().length < 10}>
          {pending ? "Sending…" : "Send to teacher"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Later
        </Button>
      </div>
    </form>
  );
}
