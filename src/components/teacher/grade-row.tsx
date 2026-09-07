"use client";

import { useState, useTransition } from "react";
import { showToast } from "@/lib/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gradeSubmission } from "@/lib/actions/teacher";
import { StateButton } from "@/components/ui/button-state";
import { SubmissionViewer } from "@/components/submission-viewer";
import { ChevronDown, ChevronUp, Mic, Play, Volume2, CheckCircle2 } from "lucide-react";

export function GradeRow({
  submissionId,
  studentName,
  score,
  canAutoScore,
  isSpeakingOrEssay = false,
  studentAnswers = {},
  exerciseContent = [],
}: {
  submissionId: string;
  studentName: string;
  score: number | null;
  canAutoScore: boolean;
  isSpeakingOrEssay?: boolean;
  studentAnswers?: Record<string, any>;
  exerciseContent?: any[];
}) {
  const [manual, setManual] = useState("");
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [isRecordingComment, setIsRecordingComment] = useState(false);
  const [pending, start] = useTransition();

  const playAudio = (url?: string | null) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => showToast("Không thể phát file âm thanh", "error"));
  };

  const handleSubmitGrade = async (manualScore?: number) => {
    try {
      const r = await gradeSubmission(submissionId, manualScore);
      showToast(
        `${studentName}: ${r.score}/100 — Trình độ cập nhật ${r.breakdown.cefrBand} (${r.breakdown.compositeScore})`,
        "success",
      );
      setManual("");
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Chấm điểm thất bại", "error");
      return false;
    }
  };

  const parsed = Number(manual);
  const manualValid = manual !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;

  return (
    <li className="flex flex-col border-b border-border bg-card p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 min-w-24 flex-1 text-left font-bold text-sm text-foreground hover:text-primary transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          <span className="truncate">{studentName}</span>
        </button>

        {isSpeakingOrEssay ? (
          <span className="rounded-full bg-persona-soft px-2.5 py-1 text-xs font-bold text-foreground border border-border">
            Tự luận / Nói
          </span>
        ) : score !== null ? (
          <span className="rounded-full bg-success px-2.5 py-1 text-xs font-black text-foreground border border-border">
            {score} điểm
          </span>
        ) : null}

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Điểm"
            className="h-8 w-20 bg-canvas border-input text-foreground font-bold text-xs text-center"
          />

          <StateButton
            onClickAction={() => handleSubmitGrade(parsed)}
            disabled={!manualValid}
            className="h-8 px-3 text-xs bg-primary text-primary-foreground font-bold"
          >
            Lưu điểm
          </StateButton>

          {isSpeakingOrEssay ? (
            <StateButton
              onClickAction={() => {
                setExpanded(true);
                return handleSubmitGrade(manualValid ? parsed : 80);
              }}
              className="h-8 px-3 text-xs bg-warning text-foreground font-black"
            >
              Nghe &amp; chấm
            </StateButton>
          ) : canAutoScore ? (
            <StateButton
              onClickAction={() => handleSubmitGrade(undefined)}
              className="h-8 px-3 text-xs bg-canvas text-foreground font-bold border border-border"
            >
              {score === null ? "Tự chấm" : "Chấm lại"}
            </StateButton>
          ) : null}
        </div>
      </div>

      {expanded && (
        <div className="p-4 border border-border rounded-lg space-y-4 text-xs bg-card text-foreground animate-in fade-in duration-150">
          <span className="font-extrabold uppercase text-primary tracking-wider block">
            Chi tiết bài làm của học sinh:
          </span>

          {Object.keys(studentAnswers).length === 0 ? (
            <p className="text-muted-foreground italic">Không có chi tiết câu trả lời bổ sung.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(studentAnswers).map(([exId, ans], idx) => {
                const isMediaUrl = typeof ans === "string" && (ans.startsWith("http") || ans.startsWith("blob:") || ans.startsWith("/"));
                const mediaType = typeof ans === "string" && ans.endsWith(".pdf") ? "file" : typeof ans === "string" && (ans.endsWith(".png") || ans.endsWith(".jpg")) ? "image" : "audio";
                
                return (
                  <div key={exId} className="p-3 border border-border rounded-lg space-y-1.5 bg-canvas">
                    <span className="font-bold text-primary block">Câu {idx + 1}:</span>
                    {isMediaUrl ? (
                      <SubmissionViewer type={mediaType} mediaUrl={ans} />
                    ) : (
                      <p className="text-foreground font-mono p-2.5 rounded border border-border bg-card">
                        {typeof ans === "object" ? JSON.stringify(ans) : String(ans)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Teacher Comment Multiformat Controls (§1.3) */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="font-bold text-foreground block">Nhận xét của Giáo viên (Văn bản, Ghi âm, hoặc Ảnh bài chấm tay):</label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nhập nhận xét bằng văn bản..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-input rounded-lg p-2.5 text-xs text-foreground bg-canvas outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingComment(!isRecordingComment);
                    showToast(
                      isRecordingComment ? "Đã dừng ghi âm nhận xét" : "Đang ghi âm nhận xét giọng nói...",
                      "info",
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-border transition-colors ${
                    isRecordingComment ? "bg-destructive text-white animate-pulse" : "bg-canvas text-foreground"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-primary" />
                  <span>{isRecordingComment ? "Đang ghi..." : "Ghi nhận xét giọng nói"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
