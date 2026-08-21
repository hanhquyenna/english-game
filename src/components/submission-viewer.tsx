"use client";

import { useState } from "react";
import { Play, Pause, FileText, Download, Maximize2, X, Image as ImageIcon, Video as VideoIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubmissionViewerProps {
  type: "text" | "audio" | "image" | "video" | "file" | string;
  content?: string | null;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  className?: string;
}

export function SubmissionViewer({
  type,
  content,
  mediaUrl,
  mediaMimeType,
  fileName = "tep_tin_nop_bai",
  fileSizeBytes,
  className,
}: SubmissionViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf =
    mediaMimeType?.includes("pdf") ||
    mediaUrl?.toLowerCase().endsWith(".pdf") ||
    fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className={cn("space-y-3", className)}>
      {/* TEXT CONTENT */}
      {content && (
        <div
          className="p-3.5 border-2 border-st-fg rounded-xl text-st-fg text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-sm"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          {content}
        </div>
      )}

      {/* AUDIO PLAYER */}
      {type === "audio" && mediaUrl && (
        <div
          className="p-3 border-2 border-st-fg rounded-xl flex items-center gap-3 shadow-sm"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <div
            className="p-2.5 rounded-lg shrink-0 font-bold"
            style={{ backgroundColor: "var(--st-peach)", color: "var(--st-fg)" }}
          >
            <Mic className="w-5 h-5" style={{ color: "var(--st-primary)" }} />
          </div>
          <audio controls src={mediaUrl} className="w-full h-9" />
        </div>
      )}

      {/* IMAGE WITH LIGHTBOX */}
      {type === "image" && mediaUrl && (
        <div className="space-y-2">
          <div className="relative group inline-block overflow-hidden rounded-xl border-2 border-st-fg max-w-sm shadow-sm" style={{ backgroundColor: "var(--st-card)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt="Bài nộp học sinh"
              className="w-full max-h-72 object-cover transition-transform group-hover:scale-105 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-2 right-2 p-1.5 border-2 border-st-fg rounded-lg text-xs font-bold flex items-center gap-1 opacity-90 transition-opacity shadow-md"
              style={{ backgroundColor: "var(--st-accent)", color: "var(--st-fg)" }}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Phóng to
            </button>
          </div>

          {/* Lightbox Modal */}
          {lightboxOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 border-2 border-st-fg rounded-full hover:opacity-80 transition-opacity shadow-xl"
                style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
              >
                <X className="w-6 h-6" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Phóng to bài nộp"
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border-4 border-st-fg"
              />
            </div>
          )}
        </div>
      )}

      {/* VIDEO PLAYER INLINE */}
      {type === "video" && mediaUrl && (
        <div className="overflow-hidden rounded-xl border-2 border-st-fg max-w-md bg-black shadow-sm">
          <video controls src={mediaUrl} className="w-full max-h-80" />
        </div>
      )}

      {/* FILE (PDF or DOC/DOCX) */}
      {type === "file" && mediaUrl && (
        <div>
          {isPdf ? (
            <div className="space-y-2">
              <iframe
                src={mediaUrl}
                title="Xem bài nộp PDF"
                className="w-full h-80 rounded-xl border-2 border-st-fg shadow-sm"
              />
              <a
                href={mediaUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-st-primary hover:underline"
              >
                <Download className="w-4 h-4" /> Tải về file PDF gốc ({formatFileSize(fileSizeBytes)})
              </a>
            </div>
          ) : (
            <div
              className="p-4 border-2 border-st-fg rounded-xl flex items-center justify-between shadow-sm"
              style={{ backgroundColor: "var(--st-card)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: "var(--st-mint)", color: "var(--st-fg)" }}
                >
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-st-fg">{fileName}</p>
                  <p className="text-[11px] text-st-muted-fg">{formatFileSize(fileSizeBytes)}</p>
                </div>
              </div>
              <a
                href={mediaUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 font-bold rounded-lg text-xs transition-opacity active:opacity-80 border-2 border-st-fg"
                style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
              >
                <Download className="w-4 h-4" /> Tải xuống để xem
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
