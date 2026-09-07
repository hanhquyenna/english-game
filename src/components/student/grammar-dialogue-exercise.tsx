"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";

export interface DialogueOption {
  text: string;
  isCorrect: boolean;
  commonErrorExplanation?: string;
}

export interface GrammarDialogueExerciseProps {
  grammarRuleTitle: string;
  dialogueContext: { speaker: string; text: string }[];
  options: DialogueOption[];
  onComplete: (correct: boolean) => void;
}

export function GrammarDialogueExercise({
  grammarRuleTitle,
  dialogueContext,
  options,
  onComplete,
}: GrammarDialogueExerciseProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedOpt = selectedIdx !== null ? options[selectedIdx] : null;

  const handleCheck = () => {
    if (selectedIdx === null) return;
    setSubmitted(true);
    if (selectedOpt?.isCorrect) {
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  return (
    <Tile className="p-5 space-y-4 border-2 border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
      <div className="space-y-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary flex items-center gap-1">
          <Sparkles className="w-4 h-4" style={{ color: "var(--st-accent)" }} /> Ngữ pháp hội thoại: {grammarRuleTitle}
        </span>
        <h3 className="st-display text-base font-black text-st-fg">
          Chọn câu trả lời tự nhiên nhất phù hợp với tình huống hội thoại dưới đây:
        </h3>
      </div>

      {/* Short dialogue context */}
      <div className="p-4 border-2 border-st-fg rounded-xl space-y-3" style={{ backgroundColor: "var(--st-bg)" }}>
        {dialogueContext.map((d, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="font-extrabold shrink-0 text-st-primary">{d.speaker}:</span>
            <span className="text-st-fg font-medium">{d.text}</span>
          </div>
        ))}
      </div>

      {/* Options list */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          let optionStyle = "border-st-fg text-st-fg";
          let bgStyle = "var(--st-bg)";

          if (submitted) {
            if (opt.isCorrect) {
              optionStyle = "border-st-fg font-bold";
              bgStyle = "var(--st-mint)";
            } else if (isSelected) {
              optionStyle = "border-st-fg font-bold";
              bgStyle = "var(--st-peach)";
            }
          } else if (isSelected) {
            optionStyle = "border-st-fg font-bold ring-2 ring-st-primary";
            bgStyle = "var(--st-peach)";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={submitted}
              onClick={() => setSelectedIdx(idx)}
              style={{ backgroundColor: bgStyle }}
              className={`w-full p-3.5 rounded-xl border-2 text-xs text-left flex items-center justify-between transition-all ${optionStyle}`}
            >
              <span>{opt.text}</span>
              {submitted && opt.isCorrect && <CheckCircle className="w-4 h-4 text-st-secondary shrink-0" />}
              {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-st-destructive shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Common Error Explanation on Wrong Selection (§2.2) */}
      {submitted && selectedOpt && !selectedOpt.isCorrect && (
        <div
          className="p-3.5 border-2 border-st-fg rounded-xl space-y-1 text-xs leading-relaxed animate-in fade-in duration-200"
          style={{ backgroundColor: "var(--st-peach)", color: "var(--st-fg)" }}
        >
          <div className="flex items-center gap-1.5 font-extrabold text-st-primary">
            <AlertCircle className="w-4 h-4" />
            <span>Lỗi hay gặp trong tình huống này:</span>
          </div>
          <p className="pl-5 font-medium">
            {selectedOpt.commonErrorExplanation || "Lựa chọn này chưa đúng ngữ cảnh hội thoại tự nhiên."}
          </p>
        </div>
      )}

      {/* Submit / Check Button */}
      {!submitted && (
        <StateButton
          onClickAction={handleCheck}
          disabled={selectedIdx === null}
          className="w-full min-h-[44px] font-black uppercase text-xs tracking-wider border-2 border-st-fg"
          style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
        >
          Kiểm tra câu trả lời
        </StateButton>
      )}
    </Tile>
  );
}
