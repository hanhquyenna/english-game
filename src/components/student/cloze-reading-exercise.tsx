"use client";

import { useState } from "react";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";

export interface ClozeBlank {
  id: string;
  correctAnswer: string;
  options: string[];
}

export function ClozeReadingExercise({
  topicTitle,
  paragraphSegments,
  blanks,
  onComplete,
}: {
  topicTitle: string;
  paragraphSegments: string[];
  blanks: ClozeBlank[];
  onComplete: (correctCount: number, totalCount: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (blankId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [blankId]: val }));
  };

  const handleCheck = () => {
    let correctCount = 0;
    blanks.forEach((b) => {
      if (answers[b.id]?.toLowerCase().trim() === b.correctAnswer.toLowerCase().trim()) {
        correctCount++;
      }
    });

    setSubmitted(true);
    onComplete(correctCount, blanks.length);
  };

  const allFilled = blanks.every((b) => answers[b.id]);

  return (
    <Tile className="p-5 space-y-4 border-2 border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
      <div className="space-y-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary flex items-center gap-1">
          <BookOpen className="w-4 h-4" style={{ color: "var(--st-primary)" }} /> Arena Cloze Reading: {topicTitle}
        </span>
        <h3 className="st-display text-base font-black text-st-fg">
          Đọc mạch văn toàn đoạn và điền từ thích hợp vào các chỗ trống:
        </h3>
      </div>

      {/* Paragraph rendering with interactive inline select blanks */}
      <div className="p-4 border-2 border-st-fg rounded-xl text-sm leading-loose text-st-fg font-medium" style={{ backgroundColor: "var(--st-bg)" }}>
        {paragraphSegments.map((segment, idx) => {
          const blank = blanks[idx];
          return (
            <span key={idx}>
              <span>{segment}</span>
              {blank && (
                <span className="inline-block mx-1">
                  <select
                    disabled={submitted}
                    value={answers[blank.id] ?? ""}
                    onChange={(e) => handleSelect(blank.id, e.target.value)}
                    className="px-2 py-1 text-xs font-bold rounded-lg border-2 border-st-fg outline-none transition-colors"
                    style={{
                      backgroundColor: submitted
                        ? answers[blank.id] === blank.correctAnswer
                          ? "var(--st-mint)"
                          : "var(--st-peach)"
                        : answers[blank.id]
                          ? "var(--st-card)"
                          : "var(--st-bg)",
                      color: "var(--st-fg)",
                    }}
                  >
                    <option value="">[Chọn từ ({idx + 1})]</option>
                    {blank.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Results breakdown per blank (§2.3) */}
      {submitted && (
        <div className="p-3.5 border-2 border-st-fg rounded-xl space-y-2 text-xs" style={{ backgroundColor: "var(--st-card)" }}>
          <span className="font-extrabold text-st-primary block">Kết quả từng chỗ trống:</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {blanks.map((b, idx) => {
              const isCorrect = answers[b.id] === b.correctAnswer;
              return (
                <div
                  key={b.id}
                  className="p-2 rounded-lg border-2 border-st-fg flex items-center justify-between font-bold"
                  style={{
                    backgroundColor: isCorrect ? "var(--st-mint)" : "var(--st-peach)",
                    color: "var(--st-fg)",
                  }}
                >
                  <span>Chỗ trống ({idx + 1}): <strong>{b.correctAnswer}</strong></span>
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-st-secondary" /> : <XCircle className="w-4 h-4 text-st-destructive" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!submitted && (
        <StateButton
          onClickAction={handleCheck}
          disabled={!allFilled}
          className="w-full min-h-[44px] font-black uppercase text-xs tracking-wider border-2 border-st-fg"
          style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
        >
          Kiểm tra bài đọc hiểu
        </StateButton>
      )}
    </Tile>
  );
}
