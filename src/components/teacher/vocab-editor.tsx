"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addVocabItem, deleteVocabItem } from "@/lib/actions/teacher";

type Item = {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
};

export function VocabEditor({
  topicId,
  teacherId,
  items,
}: {
  topicId: string;
  teacherId: string;
  items: Item[];
}) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-semibold">{item.term}</span>
                  <span className="text-muted-foreground"> — {item.meaning}</span>
                </p>
                {item.example ? (
                  <p className="mt-0.5 text-xs italic text-muted-foreground">
                    {item.example}
                  </p>
                ) : null}
              </div>
              <DeleteButton
                label={item.term}
                onDelete={() => deleteVocabItem(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có từ vựng nào trong bài học này.
        </p>
      )}

      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await addVocabItem(topicId, term, meaning, example, teacherId);
              toast.success(`Đã thêm “${term.trim()}”`);
              setTerm("");
              setMeaning("");
              setExample("");
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Không thêm được",
              );
            }
          });
        }}
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Từ tiếng Anh"
          aria-label="Từ tiếng Anh"
          maxLength={60}
        />
        <Input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Nghĩa tiếng Việt"
          aria-label="Nghĩa tiếng Việt"
          maxLength={120}
        />
        <Input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Câu ví dụ (không bắt buộc)"
          aria-label="Câu ví dụ"
          maxLength={200}
        />
        <Button type="submit" disabled={pending || !term.trim() || !meaning.trim()}>
          {pending ? "…" : "Thêm"}
        </Button>
      </form>
    </div>
  );
}

export function DeleteButton({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="shrink-0 text-muted-foreground hover:text-[var(--danger)]"
      onClick={() => {
        // Two-step rather than a modal: deleting content the teacher just
        // typed should be reversible-feeling, not a trap.
        if (!confirming) {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 3000);
          return;
        }
        start(async () => {
          try {
            await onDelete();
            toast.success(`Đã xoá “${label}”`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không xoá được");
          }
        });
      }}
    >
      {pending ? "…" : confirming ? "Chắc chắn?" : "Xoá"}
    </Button>
  );
}
