"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast-store";
import {
  approveJournalEntry,
  rejectJournalEntry,
  gradeSpeakingAttempt,
} from "@/lib/actions/teacher";
import { StateButton } from "@/components/ui/button-state";
import { SubmissionViewer } from "@/components/submission-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Star, CheckCircle, XCircle, Play } from "lucide-react";

export function StudentPortfolioDetailClient({
  teacherId,
  studentId,
  journals,
  speakings,
}: {
  teacherId: string;
  studentId: string;
  journals: any[];
  speakings: any[];
}) {
  const [journalComments, setJournalComments] = useState<Record<string, string>>({});
  const [journalStars, setJournalStars] = useState<Record<string, number>>({});
  const [speakingScores, setSpeakingScores] = useState<Record<string, number>>({});

  const playAudio = (url?: string | null) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => showToast("Không thể phát file âm thanh", "error"));
  };

  const handleApproveJournal = async (entryId: string) => {
    const starRating = journalStars[entryId] ?? 5;
    const comment = journalComments[entryId] ?? "";

    try {
      await approveJournalEntry({ entryId, starRating, comment });
      showToast("Đã duyệt bài nhật ký và cộng +10 XP + 5 gems cho học sinh!", "success");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Duyệt thất bại", "error");
      return false;
    }
  };

  const handleRejectJournal = async (entryId: string) => {
    const comment = journalComments[entryId] ?? "";
    try {
      await rejectJournalEntry(entryId, comment);
      showToast("Đã yêu cầu học sinh viết lại nhật ký", "info");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Thao tác thất bại", "error");
      return false;
    }
  };

  const handleGradeSpeaking = async (attemptId: string) => {
    const score = speakingScores[attemptId] ?? 80;
    try {
      await gradeSpeakingAttempt({ attemptId, score });
      showToast(`Đã lưu điểm bài nói: ${score} điểm!`, "success");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Chấm điểm thất bại", "error");
      return false;
    }
  };

  // Merge entries chronologically
  const items = [
    ...journals.map((j) => ({ type: "journal" as const, data: j, date: new Date(j.created_at) })),
    ...speakings.map((s) => ({ type: "speaking" as const, data: s, date: new Date(s.created_at) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Học sinh này chưa nộp bài Nhật ký hoặc Luyện nói nào.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        if (item.type === "journal") {
          const j = item.data;
          const isApproved = j.status === "approved";
          const isRejected = j.status === "rejected";

          return (
            <Card key={`j-${j.id}-${idx}`} className="border-2 border-st-fg font-medium shadow-sm" style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-st-muted">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-st-primary" />
                  <CardTitle className="text-base font-bold text-st-fg">Bài viết Nhật ký (Journal)</CardTitle>
                </div>
                <div>
                  {isApproved ? (
                    <Badge className="bg-st-mint text-st-fg font-bold border border-st-fg">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Đã duyệt (+10 XP + 5 Gems)
                    </Badge>
                  ) : isRejected ? (
                    <Badge variant="destructive">Cần viết lại</Badge>
                  ) : (
                    <Badge className="bg-st-peach text-st-fg font-bold border border-st-fg">Chờ duyệt</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <SubmissionViewer
                  type={j.type || (j.audio_url ? "audio" : "text")}
                  content={j.text}
                  mediaUrl={j.audio_url}
                />

                {/* Quick Star Rating & Comment controls */}
                <div className="space-y-3 p-3 border-2 border-st-fg rounded-xl" style={{ backgroundColor: "var(--st-bg)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-st-fg">Đánh giá sao:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setJournalStars((prev) => ({ ...prev, [j.id]: star }))}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= (journalStars[j.id] ?? j.star_rating ?? 5)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Nhập lời khen hoặc nhận xét cho học sinh..."
                    value={journalComments[j.id] ?? j.teacher_comment ?? ""}
                    onChange={(e) =>
                      setJournalComments((prev) => ({ ...prev, [j.id]: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />

                  <div className="flex gap-2 justify-end pt-1">
                    <StateButton
                      onClickAction={() => handleApproveJournal(j.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Duyệt bài (+10 XP + 5 Gems)
                    </StateButton>
                    <StateButton
                      onClickAction={() => handleRejectJournal(j.id)}
                      variant="destructive"
                      className="font-bold text-xs uppercase"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Yêu cầu sửa
                    </StateButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Speaking Attempt card
        const s = item.data;
        const isGraded = s.overall_score !== null;

        return (
          <Card key={`s-${s.id}-${idx}`} className="border-slate-800 bg-slate-900/90 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base font-bold">
                  Bài Luyện nói (Lần thử {s.attempt_number})
                </CardTitle>
              </div>
              <div>
                {isGraded ? (
                  <Badge className="bg-emerald-500 text-slate-950 font-extrabold">
                    {s.overall_score} điểm
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500 text-white font-bold">Cần nghe &amp; chấm</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">File ghi âm của học sinh:</span>
                <button
                  type="button"
                  onClick={() => playAudio(s.audio_url)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" /> Nghe bài nói
                </button>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Nhập điểm chấm thủ công (0-100):</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={speakingScores[s.id] ?? s.overall_score ?? 80}
                    onChange={(e) =>
                      setSpeakingScores((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                    }
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg p-2 text-center text-sm font-bold text-amber-300 outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <StateButton
                    onClickAction={() => handleGradeSpeaking(s.id)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase"
                  >
                    Nghe &amp; chấm lưu điểm
                  </StateButton>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
