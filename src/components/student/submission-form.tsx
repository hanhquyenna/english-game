"use client";

import { useState, useRef } from "react";
import { showToast } from "@/lib/toast-store";
import { StateButton } from "@/components/ui/button-state";
import { FileText, Mic, Image as ImageIcon, Video as VideoIcon, Upload, Send, X } from "lucide-react";
import { Mono, Tile } from "@/components/student/ui";

export interface SubmissionFormProps {
  studentId: string;
  sourceType: "journal" | "homework" | "speaking";
  sourceRefId?: string;
  allowedTypes?: string[];
  onSubmitAction: (data: {
    type: "text" | "audio" | "image" | "video" | "file";
    content?: string;
    mediaUrl?: string;
    mediaMimeType?: string;
    fileSizeBytes?: number;
    durationSeconds?: number;
  }) => Promise<boolean>;
}

export function SubmissionForm({
  studentId,
  sourceType,
  sourceRefId,
  allowedTypes = ["text", "audio", "image", "video", "file"],
  onSubmitAction,
}: SubmissionFormProps) {
  const [selectedType, setSelectedType] = useState<"text" | "audio" | "image" | "video" | "file">(
    (allowedTypes[0] as any) || "text",
  );
  const [textContent, setTextContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name?: string; size?: number; mime?: string; duration?: number }>({});
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, expectedType: "image" | "video" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (expectedType === "image" && file.size > 10 * 1024 * 1024) {
      showToast("Ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh nhỏ hơn.", "error");
      return;
    }
    if (expectedType === "video" && file.size > 50 * 1024 * 1024) {
      showToast("Video vượt quá giới hạn 50MB. Vui lòng nén bớt trước khi nộp.", "error");
      return;
    }
    if (expectedType === "file" && file.size > 20 * 1024 * 1024) {
      showToast("Tệp tin vượt quá giới hạn 20MB.", "error");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileMeta({
      name: file.name,
      size: file.size,
      mime: file.type,
    });
  };

  const handleSubmit = async () => {
    if (selectedType === "text" && !textContent.trim()) {
      showToast("Vui lòng nhập nội dung văn bản trước khi gửi", "error");
      return false;
    }
    if (selectedType !== "text" && !previewUrl) {
      showToast("Vui lòng chọn hoặc ghi âm file trước khi gửi", "error");
      return false;
    }

    try {
      const res = await onSubmitAction({
        type: selectedType,
        content: textContent.trim() || undefined,
        mediaUrl: previewUrl || undefined,
        mediaMimeType: fileMeta.mime,
        fileSizeBytes: fileMeta.size,
        durationSeconds: fileMeta.duration,
      });

      if (res) {
        setSubmitted(true);
        showToast("Nộp bài thành công!", "success");
      }
      return res;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Nộp bài thất bại", "error");
      return false;
    }
  };

  if (submitted) {
    return (
      <Tile className="p-4 border-2 border-st-fg text-center rounded-2xl" style={{ backgroundColor: "var(--st-mint)", color: "var(--st-fg)" }}>
        <h3 className="st-display text-lg font-black">Đã nộp bài thành công ✓</h3>
        <Mono className="mt-1 block text-xs opacity-80">
          Bài làm của em đang chờ giáo viên nhận xét và chấm thưởng.
        </Mono>
      </Tile>
    );
  }

  return (
    <Tile className="p-4 space-y-4 border-2 border-st-fg shadow-sm" style={{ backgroundColor: "var(--st-card)" }}>
      {/* Allowed Type selector buttons */}
      <div className="space-y-1.5">
        <span className="text-xs uppercase font-extrabold text-st-primary tracking-wider block">
          Chọn định dạng bài nộp được phép:
        </span>
        <div className="flex flex-wrap gap-2">
          {allowedTypes.includes("text") && (
            <button
              type="button"
              onClick={() => setSelectedType("text")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                selectedType === "text"
                  ? "bg-st-primary text-st-primary-fg border-st-fg shadow-md"
                  : "bg-st-bg border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <FileText className="w-4 h-4" /> Viết chữ
            </button>
          )}

          {allowedTypes.includes("audio") && (
            <button
              type="button"
              onClick={() => setSelectedType("audio")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                selectedType === "audio"
                  ? "bg-st-accent text-st-fg border-st-fg shadow-md"
                  : "bg-st-bg border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <Mic className="w-4 h-4" /> Ghi âm
            </button>
          )}

          {allowedTypes.includes("image") && (
            <button
              type="button"
              onClick={() => setSelectedType("image")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                selectedType === "image"
                  ? "bg-st-mint text-st-fg border-st-fg shadow-md"
                  : "bg-st-bg border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Chụp ảnh
            </button>
          )}

          {allowedTypes.includes("video") && (
            <button
              type="button"
              onClick={() => setSelectedType("video")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                selectedType === "video"
                  ? "bg-st-peach text-st-fg border-st-fg shadow-md"
                  : "bg-st-bg border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <VideoIcon className="w-4 h-4" /> Quay Video
            </button>
          )}

          {allowedTypes.includes("file") && (
            <button
              type="button"
              onClick={() => setSelectedType("file")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                selectedType === "file"
                  ? "bg-st-lavender text-st-fg border-st-fg shadow-md"
                  : "bg-st-bg border-st-fg text-st-fg hover:opacity-80"
              }`}
            >
              <Upload className="w-4 h-4" /> Tải file (PDF/Doc)
            </button>
          )}
        </div>
      </div>

      {/* INPUT AREA BASED ON TYPE */}
      {selectedType === "text" && (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          rows={4}
          placeholder="Nhập nội dung bài nộp..."
          className="w-full border-2 border-st-fg rounded-xl p-3 text-xs text-st-fg outline-none focus:ring-2 focus:ring-st-primary"
          style={{ backgroundColor: "var(--st-bg)" }}
        />
      )}

      {(selectedType === "image" || selectedType === "video" || selectedType === "file") && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={
              selectedType === "image"
                ? "image/*"
                : selectedType === "video"
                  ? "video/*"
                  : ".pdf,.doc,.docx"
            }
            onChange={(e) => handleFileSelect(e, selectedType)}
            className="hidden"
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-st-fg hover:border-st-primary rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: "var(--st-bg)" }}
            >
              <Upload className="w-8 h-8" style={{ color: "var(--st-primary)" }} />
              <span className="text-xs font-bold text-st-fg">
                {selectedType === "image"
                  ? "Bấm để chọn/chụp ảnh (tối đa 10MB)"
                  : selectedType === "video"
                    ? "Bấm để quay/chọn video (tối đa 50MB, 2 phút)"
                    : "Bấm để chọn tệp PDF/Doc (tối đa 20MB)"}
              </span>
            </button>
          ) : (
            <div className="p-3 border-2 border-st-fg rounded-xl space-y-2 relative" style={{ backgroundColor: "var(--st-bg)" }}>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 p-1 border-2 border-st-fg rounded-full"
                style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
              >
                <X className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-st-primary block">Xem trước bài nộp:</span>
              {selectedType === "image" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain border border-st-fg" />
              )}
              {selectedType === "video" && (
                <video controls src={previewUrl} className="max-h-48 rounded-lg w-full border border-st-fg" />
              )}
              {selectedType === "file" && (
                <div className="p-3 rounded-lg text-xs font-mono text-st-fg border border-st-fg" style={{ backgroundColor: "var(--st-card)" }}>
                  {fileMeta.name} ({Math.round((fileMeta.size ?? 0) / 1024)} KB)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <StateButton
        onClickAction={handleSubmit}
        disabled={selectedType === "text" ? !textContent.trim() : !previewUrl}
        className="w-full min-h-[44px] font-black uppercase text-xs tracking-wider border-2 border-st-fg"
        style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
      >
        <Send className="w-4 h-4 mr-1.5" /> Gửi bài làm
      </StateButton>
    </Tile>
  );
}
