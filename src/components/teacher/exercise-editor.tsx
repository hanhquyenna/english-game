"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExercise, deleteExercise } from "@/lib/actions/teacher";
import { DeleteButton } from "@/components/teacher/vocab-editor";
import { EmptyState } from "@/components/teacher/empty-state";
import type { Enums } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Buildable = Extract<Enums<"exercise_type">, "MCQ" | "FILL_BLANK" | "MATCHING">;

const TYPES: { value: Buildable; label: string; blurb: string }[] = [
  { value: "MCQ", label: "Trắc nghiệm", blurb: "Một câu hỏi, nhiều lựa chọn" },
  { value: "FILL_BLANK", label: "Điền từ", blurb: "Điền vào chỗ trống" },
  { value: "MATCHING", label: "Nối từ", blurb: "Nối cặp từ với nghĩa" },
];

type ExerciseRow = {
  id: string;
  type: Enums<"exercise_type">;
  typeLabel: string;
  content: Record<string, unknown>;
};

/** Manual exercise builder — no AI, deterministic and fast to demo (§6). */
export function ExerciseEditor({
  topicId,
  teacherId,
  grammarPoints,
  exercises,
}: {
  topicId: string;
  teacherId: string;
  grammarPoints: { id: string; name: string }[];
  exercises: ExerciseRow[];
}) {
  const [type, setType] = useState<Buildable>("MCQ");
  const [grammarPointId, setGrammarPointId] = useState("");
  const [pending, start] = useTransition();

  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [pairs, setPairs] = useState([
    { left: "", right: "" },
    { left: "", right: "" },
    { left: "", right: "" },
  ]);

  function reset() {
    setPrompt("");
    setOptions(["", "", "", ""]);
    setAnswerIndex(0);
    setAnswer("");
    setHint("");
    setPairs([
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ]);
  }

  function buildContent(): Record<string, unknown> | null {
    if (type === "MCQ") {
      const clean = options.map((o) => o.trim()).filter(Boolean);
      if (!prompt.trim() || clean.length < 2) return null;
      // Re-point the answer at the surviving options after blanks are dropped.
      const chosen = options[answerIndex]?.trim();
      const idx = chosen ? clean.indexOf(chosen) : -1;
      if (idx < 0) return null;
      return { prompt: prompt.trim(), options: clean, answerIndex: idx };
    }
    if (type === "FILL_BLANK") {
      if (!prompt.trim() || !answer.trim()) return null;
      return {
        prompt: prompt.trim(),
        answer: answer.trim(),
        hint: hint.trim() || undefined,
      };
    }
    const clean = pairs
      .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
      .filter((p) => p.left && p.right);
    if (clean.length < 2) return null;
    return { instructions: "Nối từ với nghĩa tiếng Việt.", pairs: clean };
  }

  const content = buildContent();

  return (
    <div className="space-y-5">
      {exercises.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex items-start gap-3 px-3 py-2.5">
              <span className="mt-0.5 shrink-0 rounded-full bg-black/6 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {ex.typeLabel}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <ExercisePreview type={ex.type} content={ex.content} />
              </div>
              <DeleteButton
                label="bài tập"
                onDelete={() => deleteExercise(ex.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="Chưa có bài tập luyện nào ngoài thẻ từ vựng." />
      )}

      <form
        className="space-y-3 rounded-md border bg-black/2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!content) return;
          start(async () => {
            try {
              await createExercise({
                topicId,
                teacherId,
                type,
                grammarPointId: grammarPointId || null,
                content,
              });
              toast.success("Đã thêm bài tập");
              reset();
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Không thêm được",
              );
            }
          });
        }}
      >
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                type === t.value
                  ? "border-[var(--persona)] bg-[var(--persona)] text-white"
                  : "bg-background hover:bg-black/4",
              )}
              title={t.blurb}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type !== "MATCHING" ? (
          <div>
            <Label htmlFor="ex-prompt" className="mb-1.5 block">
              {type === "FILL_BLANK"
                ? "Câu có chỗ trống (dùng ___ cho chỗ cần điền)"
                : "Câu hỏi"}
            </Label>
            <Input
              id="ex-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                type === "FILL_BLANK"
                  ? "She ___ to school every day."
                  : "Chọn đáp án đúng…"
              }
              maxLength={200}
            />
          </div>
        ) : null}

        {type === "MCQ" ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">
              Lựa chọn (chọn nút tròn ở đáp án đúng)
            </legend>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mcq-answer"
                    checked={answerIndex === i}
                    onChange={() => setAnswerIndex(i)}
                    aria-label={`Đáp án đúng là lựa chọn ${i + 1}`}
                    className="size-4 accent-[var(--persona)]"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Lựa chọn ${i + 1}`}
                    aria-label={`Lựa chọn ${i + 1}`}
                    maxLength={120}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ) : null}

        {type === "FILL_BLANK" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="ex-answer" className="mb-1.5 block">
                Đáp án
              </Label>
              <Input
                id="ex-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="goes"
                maxLength={60}
              />
            </div>
            <div>
              <Label htmlFor="ex-hint" className="mb-1.5 block">
                Gợi ý (không bắt buộc)
              </Label>
              <Input
                id="ex-hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="hiện tại đơn, ngôi thứ ba"
                maxLength={100}
              />
            </div>
          </div>
        ) : null}

        {type === "MATCHING" ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Các cặp từ</legend>
            <div className="space-y-2">
              {pairs.map((pair, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={pair.left}
                    onChange={(e) => {
                      const next = [...pairs];
                      next[i] = { ...next[i], left: e.target.value };
                      setPairs(next);
                    }}
                    placeholder="Từ tiếng Anh"
                    aria-label={`Từ tiếng Anh cặp ${i + 1}`}
                    maxLength={60}
                  />
                  <Input
                    value={pair.right}
                    onChange={(e) => {
                      const next = [...pairs];
                      next[i] = { ...next[i], right: e.target.value };
                      setPairs(next);
                    }}
                    placeholder="Nghĩa tiếng Việt"
                    aria-label={`Nghĩa tiếng Việt cặp ${i + 1}`}
                    maxLength={80}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setPairs([...pairs, { left: "", right: "" }])}
            >
              + Thêm cặp
            </Button>
          </fieldset>
        ) : null}

        {grammarPoints.length > 0 ? (
          <div>
            <Label htmlFor="ex-grammar" className="mb-1.5 block">
              Gắn với điểm ngữ pháp (không bắt buộc)
            </Label>
            <Select
              value={grammarPointId || "none"}
              onValueChange={(v) => setGrammarPointId(v === "none" || !v ? "" : v)}
            >
              <SelectTrigger id="ex-grammar" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(Không gắn)</SelectItem>
                {grammarPoints.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Bài tập gắn với ngữ pháp sẽ nâng điểm “ngữ pháp” của học sinh khi
              làm đúng.
            </p>
          </div>
        ) : null}

        <Button type="submit" disabled={pending || !content}>
          {pending ? "Đang thêm…" : "Thêm bài tập"}
        </Button>
        {!content ? (
          <p className="text-xs text-muted-foreground">
            {type === "MCQ"
              ? "Cần câu hỏi và ít nhất 2 lựa chọn, với đáp án đúng đã chọn."
              : type === "FILL_BLANK"
                ? "Cần câu hỏi và đáp án."
                : "Cần ít nhất 2 cặp từ đầy đủ."}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function ExercisePreview({
  type,
  content,
}: {
  type: Enums<"exercise_type">;
  content: Record<string, unknown>;
}) {
  if (type === "MCQ") {
    const options = (content.options as string[]) ?? [];
    const idx = Number(content.answerIndex ?? -1);
    return (
      <>
        <p>{String(content.prompt ?? "")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Đáp án: <span className="font-medium">{options[idx] ?? "Chưa có đáp án"}</span>
        </p>
      </>
    );
  }
  if (type === "FILL_BLANK") {
    return (
      <>
        <p>{String(content.prompt ?? "")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Đáp án: <span className="font-medium">{String(content.answer ?? "")}</span>
        </p>
      </>
    );
  }
  const pairs = (content.pairs as { left: string; right: string }[]) ?? [];
  return (
    <p className="text-muted-foreground">
      {pairs.map((p) => `${p.left} – ${p.right}`).join(" · ")}
    </p>
  );
}
