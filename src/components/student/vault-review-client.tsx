"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { showToast } from "@/lib/toast-store";
import { ArrowLeft, Check, Flame, RotateCw, Trophy, ThumbsDown, ThumbsUp, EyeOff, Eye, Volume2 } from "lucide-react";
import { claimWeeklyReviewBonus, recordReviewAttempt } from "@/lib/actions/vault";
import { sortForReview, type Quality, type ReviewItem } from "@/lib/sm2";
import {
  BlockButton,
  Mono,
  OutlineButton,
  PageTitleSmall,
  Tile,
} from "@/components/student/ui";

export function VaultReviewClient({
  studentId,
  initialItems,
}: {
  studentId: string;
  initialItems: (ReviewItem & { imageUrl?: string | null; audioUrl?: string | null })[];
}) {
  const [queue] = useState<ReviewItem[]>(() => sortForReview(initialItems));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [visualMode, setVisualMode] = useState(false); // RubeeShine §2.1 Visual Learning toggle
  const [pending, start] = useTransition();

  const currentItem = queue[currentIndex] as (ReviewItem & { imageUrl?: string | null; audioUrl?: string | null });
  const finished = queue.length === 0 || currentIndex >= queue.length;

  // Auto play audio when new card appears in visual mode
  useEffect(() => {
    if (visualMode && currentItem && !flipped) {
      if (currentItem.audioUrl) {
        const audio = new Audio(currentItem.audioUrl);
        audio.play().catch(() => {});
      }
    }
  }, [currentIndex, visualMode, flipped, currentItem]);

  function rate(quality: Quality) {
    if (!currentItem) return;

    start(async () => {
      try {
        await recordReviewAttempt({
          studentId,
          itemId: currentItem.id,
          itemType: currentItem.type,
          quality,
        });

        setFlipped(false);
        setCurrentIndex((i) => i + 1);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Xử lý ôn tập thất bại", "error");
      }
    });
  }

  function handleClaimBonus() {
    start(async () => {
      try {
        const res = await claimWeeklyReviewBonus(studentId);
        if (res.alreadyClaimed) {
          showToast("Đã nhận thưởng tuần này rồi", "info");
        } else {
          setBonusClaimed(true);
          showToast(res.message, "success");
        }
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Nhận thưởng thất bại", "error");
      }
    });
  }

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <div className="mb-4 flex min-h-[36px] items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/student/${studentId}/vault`}
            className="transition-opacity active:opacity-70"
          >
            <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
          </Link>
          <PageTitleSmall>Ôn tập Flashcard</PageTitleSmall>
        </div>

        {/* RubeeShine §2.1 Visual Learning Mode Toggle */}
        <button
          type="button"
          onClick={() => setVisualMode(!visualMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            visualMode
              ? "bg-st-accent border-st-fg text-st-fg shadow-md"
              : "bg-st-muted border-st-input text-st-muted-fg"
          }`}
          title="Chế độ liên kết trực tiếp Hình ảnh - Âm thanh"
        >
          {visualMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Chỉ Hình + Âm thanh</span>
        </button>
      </div>

      {finished ? (
        <Tile className="p-6 text-center" style={{ backgroundColor: "var(--st-peach)" }}>
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-st-primary">
            <Trophy size={28} className="text-st-primary-fg" aria-hidden />
          </div>
          <span className="st-display block text-[22px] text-st-fg">Hoàn thành xuất sắc!</span>
          <Mono className="mt-2 block text-st-muted-fg">
            Bạn đã ôn tập xong tất cả thẻ bài cần nhớ hôm nay.
          </Mono>

          {!bonusClaimed ? (
            <BlockButton
              tone="accent"
              className="mt-5 w-full"
              disabled={pending}
              onClick={handleClaimBonus}
            >
              <Flame size={18} aria-hidden /> Nhận thưởng +20 Gems
            </BlockButton>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 text-st-primary font-bold">
              <Check size={18} /> Đã nhận thưởng tuần này rồi
            </div>
          )}

          <Link href={`/student/${studentId}/vault`}>
            <OutlineButton className="mt-3">Trở về Kho học tập</OutlineButton>
          </Link>
        </Tile>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Mono className="text-st-muted-fg">
              Thẻ {currentIndex + 1} / {queue.length}
            </Mono>
            <span
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded"
              style={{
                backgroundColor: currentItem.type === "vocab" ? "var(--st-mint)" : "var(--st-lavender)",
                color: currentItem.type === "vocab" ? "var(--st-fg)" : "var(--st-primary)",
              }}
            >
              {currentItem.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
            </span>
          </div>

          {/* Flashcard Tile */}
          <Tile
            onClick={() => setFlipped(!flipped)}
            className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center p-6 text-center transition-all relative overflow-hidden"
            style={{ backgroundColor: "var(--st-card)" }}
          >
            {/* Visual-only mode front: Image + Audio button, NO TEXT */}
            {visualMode && !flipped ? (
              <div className="flex flex-col items-center gap-3">
                {currentItem.imageUrl ? (
                  <div className="size-36 rounded-2xl overflow-hidden border-2 border-st-fg bg-st-muted flex items-center justify-center shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentItem.imageUrl}
                      alt="Visual illustration"
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-32 rounded-2xl bg-st-accent/20 border-2 border-st-accent/40 flex items-center justify-center text-st-accent">
                    <Volume2 className="w-12 h-12" />
                  </div>
                )}
                <span className="text-xs font-bold text-st-accent flex items-center gap-1">
                  <Volume2 className="w-4 h-4" /> (Đang phát âm thanh mẫu...)
                </span>
              </div>
            ) : (
              /* Regular mode front / flipped back */
              <span className="st-display text-[26px] text-st-fg">{currentItem.term}</span>
            )}

            {flipped ? (
              <div className="mt-4 border-t-2 border-st-muted pt-4 w-full">
                {visualMode && (
                  <h4 className="text-xl font-black text-st-accent mb-2">{currentItem.term}</h4>
                )}
                <p className="text-[17px] font-bold text-st-primary">
                  {currentItem.meaningOrExplanation}
                </p>
                {currentItem.example && (
                  <p className="mt-2 text-[13px] italic text-st-muted-fg">
                    &ldquo;{currentItem.example}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <Mono className="mt-6 flex items-center gap-1 text-st-muted-fg">
                <RotateCw size={12} /> Bấm để lật thẻ xem kết quả
              </Mono>
            )}
          </Tile>

          {/* Action buttons */}
          {!flipped ? (
            <BlockButton
              tone="primary"
              className="mt-5 w-full"
              onClick={() => setFlipped(true)}
            >
              Xem đáp án
            </BlockButton>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => rate(1)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-st-destructive py-3.5 bg-st-destructive/40 text-st-fg font-bold transition-all active:scale-95 hover:bg-st-destructive/60"
              >
                <ThumbsDown className="w-5 h-5 text-st-destructive" />
                <span>Chưa nhớ</span>
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => rate(4)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-st-secondary py-3.5 bg-st-secondary/40 text-st-fg font-bold transition-all active:scale-95 hover:bg-st-secondary/60"
              >
                <ThumbsUp className="w-5 h-5 text-st-secondary" />
                <span>Đã nhớ</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
