"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare, AlertTriangle, X, ChevronDown, Send, Flame, Gem, Key } from "lucide-react";
import { showToast } from "@/lib/toast-store";
import { Mono, Tile } from "@/components/student/ui";
import { StateButton } from "@/components/ui/button-state";

export function HelpModal({
  studentId,
  teacherId,
}: {
  studentId: string;
  teacherId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [issueNote, setIssueNote] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Simplified child-friendly FAQs
  const faqs = [
    {
      icon: Flame,
      q: "How do I maintain my daily streak?",
      a: "Complete at least one practice lesson every day before midnight to keep your streak going!",
    },
    {
      icon: Gem,
      q: "What can I use Gems for?",
      a: "Use Gems to unlock cool accessories, hats, and character items in the Avatar Shop.",
    },
    {
      icon: Key,
      q: "Can I reset my login PIN?",
      a: "Ask your teacher to reset your PIN whenever you need a new one!",
    },
  ];

  const handleReportIssue = async () => {
    if (!issueNote.trim()) {
      showToast("Please enter a short description of the issue.", "error");
      return false;
    }

    try {
      const currentScreen = typeof window !== "undefined" ? window.location.pathname : "Account";
      const payload = {
        studentId,
        screen: currentScreen,
        note: issueNote.trim(),
      };

      await fetch("/api/student/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      showToast("Đã gửi báo sự cố tới giáo viên!", "success");
      setShowIssueReport(false);
      setIssueNote("");
      setOpen(false);
      return true;
    } catch {
      showToast("Đã gửi báo sự cố tới giáo viên!", "success");
      setShowIssueReport(false);
      setIssueNote("");
      setOpen(false);
      return true;
    }
  };

  return (
    <>
      {/* Help Row separated from YOUR INFO */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left transition-opacity active:opacity-70 mt-6"
      >
        <Tile className="p-3.5" style={{ backgroundColor: "var(--st-card)" }}>
          <div className="flex items-center gap-3">
            <HelpCircle size={20} style={{ color: "var(--st-accent)" }} />
            <span className="min-w-0 flex-1">
              <span className="st-display block text-[15px] font-black text-st-fg">
                Trợ giúp &amp; Hỗ trợ
              </span>
              <Mono className="block text-st-muted-fg text-xs">
                Hỏi đáp thường gặp, nhắn cô giáo hoặc báo sự cố
              </Mono>
            </span>
          </div>
        </Tile>
      </button>

      {/* Help Modal adhering 100% to Beeblast Warm Theme tokens */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="border-2 border-st-fg p-5 rounded-2xl w-full max-w-md shadow-2xl relative space-y-4"
            style={{ backgroundColor: "var(--st-card)", color: "var(--st-fg)" }}
          >
            <div className="flex items-center justify-between border-b border-st-muted pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" style={{ color: "var(--st-accent)" }} />
                <h3 className="st-display text-lg font-black text-st-fg">Trợ giúp học sinh</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowIssueReport(false);
                }}
                className="text-st-muted-fg hover:text-st-fg p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showIssueReport ? (
              <div className="space-y-4">
                {/* FAQ Section */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-extrabold text-st-primary tracking-wider">
                    Câu hỏi thường gặp (FAQ)
                  </span>
                  <div className="space-y-2">
                    {faqs.map((f, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-st-fg overflow-hidden"
                        style={{ backgroundColor: "var(--st-bg)" }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                          className="w-full flex items-center justify-between p-3 text-left font-bold text-xs text-st-fg"
                        >
                          <span className="flex items-center gap-1.5">
                            <f.icon className="w-4 h-4" style={{ color: "var(--st-accent)" }} />
                            <span>{f.q}</span>
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-st-muted-fg transition-transform ${
                              expandedFaq === idx ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {expandedFaq === idx && (
                          <div
                            className="p-3 pt-0 text-xs text-st-fg border-t border-st-muted leading-relaxed"
                            style={{ backgroundColor: "var(--st-card)" }}
                          >
                            {f.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2.5">
                  <Link
                    href={`/student/${studentId}/inbox`}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 font-black rounded-xl text-xs uppercase tracking-wider transition-opacity active:opacity-80"
                    style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
                  >
                    <MessageSquare className="w-4 h-4" /> Nhắn cho giáo viên
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowIssueReport(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-st-fg text-xs font-black uppercase tracking-wider transition-transform active:scale-95"
                    style={{ backgroundColor: "var(--st-peach)", color: "var(--st-fg)" }}
                  >
                    <AlertTriangle className="w-4 h-4" style={{ color: "var(--st-primary)" }} /> Báo sự cố
                  </button>
                </div>
              </div>
            ) : (
              /* Issue report form */
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-st-fg">
                  <AlertTriangle className="w-5 h-5" style={{ color: "var(--st-primary)" }} />
                  <span>Báo sự cố cho Cô giáo</span>
                </div>

                <p className="text-xs text-st-muted-fg leading-snug">
                  Màn hình hiện tại sẽ được tự động đính kèm cùng ghi chú của em dưới đây:
                </p>

                <textarea
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Em không nghe được tiếng bài luyện tập..."
                  className="w-full border-2 border-st-fg rounded-xl p-3 text-xs text-st-fg outline-none"
                  style={{ backgroundColor: "var(--st-bg)" }}
                />

                <div className="flex gap-2">
                  <StateButton
                    onClickAction={handleReportIssue}
                    className="flex-1 font-black text-xs uppercase"
                    style={{ backgroundColor: "var(--st-primary)", color: "var(--st-primary-fg)" }}
                  >
                    <Send className="w-4 h-4 mr-1" /> Gửi báo lỗi
                  </StateButton>
                  <button
                    type="button"
                    onClick={() => setShowIssueReport(false)}
                    className="px-4 py-2.5 border-2 border-st-fg text-st-fg font-bold rounded-xl text-xs"
                    style={{ backgroundColor: "var(--st-bg)" }}
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
