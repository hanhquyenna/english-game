"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Compass } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";

export interface CollocationOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export function CollocationExercise({
  situationTitle,
  situationDescription,
  options,
  onComplete,
}: {
  situationTitle: string;
  situationDescription: string;
  options: CollocationOption[];
  onComplete: (correct: boolean) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedOpt = selectedIdx !== null ? options[selectedIdx] : null;

  const handleCheck = () => {
    if (selectedIdx === null) return;
    setSubmitted(true);
    onComplete(Boolean(selectedOpt?.isCorrect));
  };

  return (
    <Tile className="p-5 space-y-4 border-2 border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
      <div className="space-y-1">
        <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary flex items-center gap-1">
          <Compass className="w-4 h-4" style={{ color: "var(--st-accent)" }} /> Arena Collocation: {situationTitle}
        </span>
        <h3 className="st-display text-base font-black text-st-fg">
          Chọn cụm từ cố định tự nhiên chuẩn nhất trong tình huống thực tế:
        </h3>
      </div>

      <div className="p-4 border-2 border-st-fg rounded-xl text-xs text-st-fg leading-relaxed font-medium" style={{ backgroundColor: "var(--st-bg)" }}>
        {situationDescription}
      </div>

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
              {submitted && opt.isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {submitted && selectedOpt && (
        <div
          className="p-3.5 rounded-xl border-2 border-st-fg text-xs leading-relaxed"
          style={{
            backgroundColor: selectedOpt.isCorrect ? "var(--st-mint)" : "var(--st-peach)",
            color: "var(--st-fg)",
          }}
        >
          <span className="font-bold block mb-1">
            {selectedOpt.isCorrect ? "Chính xác! Cụm từ cố định tự nhiên." : "Chưa chính xác:"}
          </span>
          <p>{selectedOpt.explanation || "Hãy sử dụng cụm từ thói quen giao tiếp chuẩn của người bản xứ."}</p>
        </div>
      )}

      {!submitted && (
        <StateButton
          onClickAction={handleCheck}
          disabled={selectedIdx === null}
          className="w-full min-h-[44px] font-black uppercase text-xs tracking-wider border-2 border-st-fg"
          style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
        >
          Kiểm tra cụm từ
        </StateButton>
      )}
    </Tile>
  );
}
