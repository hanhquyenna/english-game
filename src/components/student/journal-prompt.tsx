"use client";

import { useState, useRef } from "react";
import { showToast } from "@/lib/toast-store";
import { submitJournal } from "@/lib/actions/student";
import { UNLOCK_THRESHOLD } from "@/lib/lesson-path";
import { Mono, Tile } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";
import { Mic, MicOff, Send, CheckCircle2, FileText, Check } from "lucide-react";

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (startingPercent < UNLOCK_THRESHOLD && !open) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      showToast("Vui lòng cấp quyền truy cập micro để ghi âm", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !recordedAudioUrl) {
      showToast("Vui lòng nhập văn bản hoặc ghi âm trước khi gửi", "error");
      return false;
    }

    try {
      await submitJournal(studentId, topicId, text, recordedAudioUrl);
      setSent(true);
      showToast("Đã nộp bài nhật ký thành công!", "success");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Nộp bài thất bại. Vui lòng thử lại.", "error");
      return false;
    }
  };

  if (sent) {
    return (
      <Tile className="p-4 bg-st-secondary/40 border-2 border-st-fg text-st-fg rounded-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-st-secondary shrink-0" />
          <div>
            <span className="st-display flex items-center gap-1.5 text-[15px] font-black text-st-fg">
              Đã gửi bài nhật ký <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <Mono className="mt-0.5 block text-xs text-st-muted-fg/80">
              Giáo viên sẽ đọc bài và nhận xét. Phụ huynh cũng sẽ nhìn thấy bài nộp của bạn.
            </Mono>
          </div>
        </div>
      </Tile>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left transition-transform active:scale-[0.98]"
      >
        <Tile className="p-4" style={{ backgroundColor: "var(--st-card)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-st-secondary/60 border border-st-fg/60 rounded-xl text-st-fg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="st-display block text-[15px] text-st-fg">
                Viết Nhật ký bằng tiếng Anh về bài &ldquo;{topicTitle}&rdquo;?
              </span>
              <Mono className="mt-0.5 block text-st-muted-fg">
                Tùy chọn — Giáo viên sẽ đọc bài và chấm thưởng cho bạn.
              </Mono>
            </div>
          </div>
        </Tile>
      </button>
    );
  }

  const isFormEmpty = !text.trim() && !recordedAudioUrl;

  return (
    <Tile className="p-4" style={{ backgroundColor: "var(--st-card)" }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="journal" className="st-display block text-[15px] font-black text-st-fg">
            Viết hoặc ghi âm suy nghĩ về {topicTitle}
          </label>
          <span className="text-xs text-st-muted-fg font-mono">
            {text.trim().length}/1200 ký tự
          </span>
        </div>

        <textarea
          id="journal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1200}
          placeholder="Every morning I wake up at six o'clock. Then I..."
          autoFocus
          className="w-full rounded-xl border-2 border-st-fg bg-st-bg p-3 text-[13px] text-st-fg outline-none focus:border-st-primary transition-colors"
        />

        {/* Voice recording section */}
        <div className="flex items-center justify-between p-3 bg-st-muted/60 border border-st-input rounded-xl">
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-3 py-1.5 bg-st-destructive/80 hover:bg-st-destructive border border-st-destructive text-st-primary-fg font-bold rounded-lg text-xs transition-colors"
              >
                <Mic className="w-4 h-4 text-st-primary-fg" />
                <span>Bấm để ghi âm</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-3 py-1.5 bg-st-accent hover:bg-st-accent/80 text-st-fg font-black rounded-lg text-xs animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>Dừng ghi âm</span>
              </button>
            )}

            {recordedAudioUrl && (
              <audio controls src={recordedAudioUrl} className="h-8 max-w-[200px]" />
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <StateButton
            onClickAction={handleSubmit}
            disabled={isFormEmpty}
            className="flex-1 min-h-[42px] font-black uppercase text-xs tracking-wider"
          >
            <Send className="w-4 h-4 mr-1" /> Gửi cho giáo viên
          </StateButton>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 min-h-[42px] rounded-xl border-2 border-st-fg font-black uppercase text-xs text-st-muted-fg transition-opacity active:opacity-70"
          >
            Để sau
          </button>
        </div>
      </div>
    </Tile>
  );
}
