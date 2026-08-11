"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addGrammarPoint, deleteGrammarPoint } from "@/lib/actions/teacher";
import { DeleteButton } from "@/components/teacher/vocab-editor";

type Item = { id: string; name: string; explanation: string };

export function GrammarEditor({
  topicId,
  items,
}: {
  topicId: string;
  items: Item[];
}) {
  const [name, setName] = useState("");
  const [explanation, setExplanation] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.explanation}
                </p>
              </div>
              <DeleteButton
                label={item.name}
                onDelete={() => deleteGrammarPoint(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa có điểm ngữ pháp nào.
        </p>
      )}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              await addGrammarPoint(topicId, name, explanation);
              toast.success(`Đã thêm “${name.trim()}”`);
              setName("");
              setExplanation("");
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Không thêm được",
              );
            }
          });
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên điểm ngữ pháp, ví dụ: Past Simple"
          aria-label="Tên điểm ngữ pháp"
          maxLength={80}
        />
        <Textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Giải thích ngắn gọn bằng tiếng Việt kèm ví dụ"
          aria-label="Giải thích"
          rows={3}
          maxLength={400}
        />
        <Button
          type="submit"
          disabled={pending || !name.trim() || !explanation.trim()}
        >
          {pending ? "Đang thêm…" : "Thêm điểm ngữ pháp"}
        </Button>
      </form>
    </div>
  );
}
