"use client";

import { useState, useRef, useEffect } from "react";
import { showToast } from "@/lib/toast-store";
import { submitSpeakingAttempt } from "@/lib/actions/student";
import { StateButton } from "@/components/ui/button-state";
import { Volume2, Mic, MicOff, Play, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";

export function SpeakingExerciseClient({
  studentId,
  exerciseId,
  modelText,
  modelAudioUrl,
}: {
  studentId: string;
  exerciseId: string;
  modelText: string;
  modelAudioUrl?: string | null;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const playAudio = (url?: string | null) => {
    if (!url) {
      showToast("Chưa có mẫu âm thanh", "info");
      return;
    }
    const audio = new Audio(url);
    audio.play().catch(() => showToast("Không thể phát âm thanh", "error"));
  };

  const startRecording = async () => {
    setMicDenied(false);
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
        const durationSec = (Date.now() - startTimeRef.current) / 1000;

        if (durationSec < 1) {
          showToast("Thời lượng quá ngắn (<1s). Vui lòng ghi âm lại.", "error");
          setUserAudioUrl(null);
        } else {
          const url = URL.createObjectURL(blob);
          setUserAudioUrl(url);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      startTimeRef.current = Date.now();
      setRecordingSeconds(0);
      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setMicDenied(true);
      showToast("Không thể truy cập Micro. Vui lòng cấp quyền trong cài đặt trình duyệt.", "error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!userAudioUrl) {
      showToast("Vui lòng ghi âm câu trả lời trước khi gửi", "error");
      return false;
    }

    try {
      const res = await submitSpeakingAttempt({
        studentId,
        lessonId: exerciseId,
        audioUrl: userAudioUrl,
        modelAudioUrl,
      });

      setSubmitted(true);
      showToast(res.message, "success");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gửi bài nói thất bại", "error");
      return false;
    }
  };

  if (submitted) {
    return (
      <Tile className="p-6 border-2 border-st-fg text-center rounded-2xl" style={{ backgroundColor: "var(--st-mint)", color: "var(--st-fg)" }}>
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full border-2 border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
          <CheckCircle className="w-8 h-8" style={{ color: "var(--st-primary)" }} />
        </div>
        <h3 className="st-display text-xl font-black">
          Đã gửi, chờ giáo viên nghe và chấm
        </h3>
        <Mono className="mt-2 block text-xs opacity-80">
          Bài nói của em đã được lưu thành công. Giáo viên sẽ nghe và đưa ra nhận xét.
        </Mono>
      </Tile>
    );
  }

  return (
    <Tile className="p-5 space-y-5 border-2 border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
      {/* Model Sentence Header */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-extrabold tracking-wider text-st-primary">
          Bài tập Luyện nói (Speaking)
        </span>
        <div className="flex items-start justify-between gap-3 p-4 border-2 border-st-fg rounded-xl" style={{ backgroundColor: "var(--st-bg)" }}>
          <p className="text-lg font-black text-st-fg leading-snug">{modelText}</p>
          <button
            type="button"
            onClick={() => playAudio(modelAudioUrl)}
            className="p-2.5 rounded-lg shrink-0 transition-opacity active:opacity-80 border-2 border-st-fg"
            style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
            title="Nghe giọng mẫu"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mic Permission Alert */}
      {micDenied && (
        <div className="p-3 border-2 border-st-fg rounded-xl flex items-center gap-2 text-xs font-bold" style={{ backgroundColor: "var(--st-peach)", color: "var(--st-fg)" }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--st-primary)" }} />
          <span>Quyền truy cập micro đã bị từ chối. Vui lòng cho phép quyền mic trên trình duyệt để ghi âm.</span>
        </div>
      )}

      {/* Round Record Button */}
      <div className="flex flex-col items-center justify-center py-4 space-y-3">
        <button
          type="button"
          onClick={handleToggleRecord}
          className={`size-24 rounded-full flex items-center justify-center border-4 border-st-fg shadow-xl transition-all transform active:scale-95 ${
            isRecording ? "animate-pulse" : ""
          }`}
          style={{
            backgroundColor: isRecording ? "var(--st-destructive)" : "var(--st-primary)",
            color: "var(--st-primary-fg)",
          }}
        >
          {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>

        <Mono className="text-xs text-st-fg font-bold">
          {isRecording ? `Đang ghi âm... (${recordingSeconds}s / 60s)` : "Bấm nút tròn để ghi âm"}
        </Mono>
      </div>

      {/* Audio Comparison buttons */}
      {userAudioUrl && (
        <div className="p-4 border-2 border-st-fg rounded-xl space-y-3" style={{ backgroundColor: "var(--st-bg)" }}>
          <span className="block text-xs font-bold text-st-primary uppercase tracking-wider">
            So sánh giọng nói:
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => playAudio(modelAudioUrl)}
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-st-fg font-bold rounded-lg text-xs transition-opacity active:opacity-80"
              style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
            >
              <Play className="w-4 h-4 text-st-primary" />
              <span>Giọng mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => playAudio(userAudioUrl)}
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-st-fg font-bold rounded-lg text-xs transition-opacity active:opacity-80"
              style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
            >
              <Play className="w-4 h-4 text-st-accent" />
              <span>Giọng của em</span>
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <StateButton
        onClickAction={handleSubmit}
        disabled={!userAudioUrl || isRecording}
        className="w-full min-h-[46px] font-black uppercase text-xs tracking-wider border-2 border-st-fg"
        style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
      >
        <Send className="w-4 h-4 mr-1.5" /> Gửi bài luyện nói
      </StateButton>
    </Tile>
  );
}
