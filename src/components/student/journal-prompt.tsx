"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitJournal } from "@/lib/actions/student";
import { UNLOCK_THRESHOLD } from "@/lib/lesson-path";
import { Mono, Tile } from "@/components/student/ui";

/**
 * Optional writing reflection after a round. Styled as a tile on the
 * primary-filled Complete screen, so it uses the card surface rather than the
 * translucent treatment of the mastery tile.
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

  if (startingPercent < UNLOCK_THRESHOLD && !open) return null;

  if (sent) {
    return (
      <Tile className="p-3.5" style={{ backgroundColor: "var(--st-card)" }}>
        <span className="st-display block text-[15px] text-st-primary">
          Sent to your teacher
        </span>
        <Mono className="mt-1 block text-st-muted-fg">
          Your teacher will read it and reply. Your parents can see it too.
        </Mono>
      </Tile>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left transition-opacity active:opacity-70"
      >
        <Tile className="p-3.5" style={{ backgroundColor: "var(--st-card)" }}>
          <span className="st-display block text-[15px] text-st-fg">
            Write a few sentences about {topicTitle}?
          </span>
          <Mono className="mt-1 block text-st-muted-fg">
            Optional — your teacher will read it and comment.
          </Mono>
        </Tile>
      </button>
    );
  }

  return (
    <Tile className="p-3.5" style={{ backgroundColor: "var(--st-card)" }}>
      <form
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
        <label htmlFor="journal" className="st-display block text-[15px] text-st-fg">
          Write in English about {topicTitle}
        </label>
        <textarea
          id="journal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1200}
          placeholder="Every morning I wake up at six o'clock. Then I…"
          autoFocus
          className="mt-2 w-full rounded-[2px] border-2 border-st-fg bg-st-bg p-2.5 text-[13px] text-st-fg outline-none"
        />
        <Mono className="block text-st-muted-fg">
          {text.trim().length}/10 characters minimum
        </Mono>
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            disabled={pending || text.trim().length < 10}
            className="st-mono min-h-[38px] flex-1 rounded-[2px] font-black uppercase tracking-[0.6px] transition-opacity active:opacity-70 disabled:opacity-40"
            style={{
              backgroundColor: "var(--st-primary)",
              color: "var(--st-primary-fg)",
            }}
          >
            {pending ? "Sending…" : "Send to teacher"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="st-mono min-h-[38px] flex-1 rounded-[2px] border-2 border-st-fg font-black uppercase tracking-[0.6px] text-st-muted-fg transition-opacity active:opacity-70"
          >
            Later
          </button>
        </div>
      </form>
    </Tile>
  );
}
