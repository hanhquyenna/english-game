"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClassPost } from "@/lib/actions/teacher";
import { StateButton } from "@/components/ui/button-state";
import { Eye, Edit3, Send, X, Megaphone } from "lucide-react";

/** Class Story (§13) — ambient visibility for parents beyond the numbers. */
export function ClassPostForm({
  classId,
  teacherId,
}: {
  classId: string;
  teacherId: string;
}) {
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleConfirmPost = async () => {
    if (!text.trim()) {
      showToast("Vui lòng nhập nội dung thông báo", "error");
      return false;
    }

    try {
      await createClassPost(classId, teacherId, text);
      showToast("Đã đăng thông báo thành công cho cả lớp!", "success");
      setText("");
      setShowPreview(false);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể đăng thông báo", "error");
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-sky-400" />
          <span>Đăng thông báo cho lớp</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Thông báo sẽ hiển thị trực tiếp cho cả học sinh và phụ huynh.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Tuần này lớp mình học Unit 3 – Daily Routine. Các em nhớ luyện tập mỗi ngày nhé!"
            rows={3}
            maxLength={500}
            aria-label="Nội dung thông báo"
          />

          <Button
            type="button"
            disabled={!text.trim()}
            onClick={() => setShowPreview(true)}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
          >
            <Eye className="w-4 h-4 mr-1.5" />Xem trước &amp; Đăng thông báo
          </Button>
        </div>
      </CardContent>

      {/* B4 Preview Modal before actual POST */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-slate-700 text-white p-5 rounded-2xl w-full max-w-md shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">
                Xem trước thông báo (Preview)
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-800/90 border border-slate-700/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">Cô giáo (Thông báo lớp)</span>
                <span className="text-[10px] text-slate-400 font-mono">Vừa xong</span>
              </div>
              <p className="text-sm font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
                {text}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <StateButton
                onClickAction={handleConfirmPost}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase"
              >
                <Send className="w-4 h-4 mr-1" /> Xác nhận đăng
              </StateButton>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Sửa lại
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
