"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Gem, Volume2 } from "lucide-react";
import { claimStoryPageReward } from "@/lib/actions/game-loop-actions";
import { Mono, PageTitle, ProgressTrack, Tile } from "@/components/student/ui";

interface WordTiming {
  word: string;
  start_ms: number;
  end_ms: number;
}

interface StoryPageData {
  id: string;
  order: number;
  illustration_url?: string;
  text_en: string;
  audio_url?: string;
  word_timings?: WordTiming[];
}

interface StoryReaderProps {
  studentId: string;
  story: {
    id: string;
    title: string;
    cover_url?: string;
  };
  pages: StoryPageData[];
}

export function StoryReaderClient({ studentId, story, pages }: StoryReaderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentMs, setAudioCurrentMs] = useState(0);
  const [claimedPages, setClaimedPages] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentPage = pages[currentPageIndex] || {
    id: "p1",
    order: 1,
    illustration_url: "",
    text_en: "Once upon a time in Beeblast kingdom...",
    word_timings: [],
  };

  const totalPages = pages.length || 1;
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const wordTimings: WordTiming[] = useMemo(
    () => currentPage.word_timings || [],
    [currentPage.word_timings],
  );

  useEffect(() => {
    if (isPlayingAudio) {
      const startTime = Date.now();
      audioTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setAudioCurrentMs(elapsed);

        // Stop audio simulation after max timing or 4s
        const maxTime = wordTimings.length > 0
          ? wordTimings[wordTimings.length - 1].end_ms
          : 4000;

        if (elapsed >= maxTime) {
          setIsPlayingAudio(false);
          if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        }
      }, 50);
    } else {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    }
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, [isPlayingAudio, wordTimings]);

  // Check and claim gem reward when reaching page
  useEffect(() => {
    const claimReward = async () => {
      if (!currentPage?.id) return;
      try {
        const res = await claimStoryPageReward({
          studentId,
          storyId: story.id,
          pageId: currentPage.id,
        });

        if (res.gemsAwarded > 0) {
          setClaimedPages((prev) => ({ ...prev, [currentPage.id]: true }));
          showToast(`+${res.gemsAwarded} Gem! ${res.message}`);
        }
      } catch {
        // Silent fallback
      }
    };

    claimReward();
  }, [currentPageIndex, currentPage?.id, studentId, story.id, showToast]);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    setAudioCurrentMs(0);
  };

  const isWordActive = (wt: WordTiming) => {
    if (!isPlayingAudio) return false;
    return audioCurrentMs >= wt.start_ms && audioCurrentMs <= wt.end_ms;
  };

  const words = wordTimings.length > 0
    ? wordTimings
    : currentPage.text_en.split(" ").map((w, idx) => ({
        word: w,
        start_ms: idx * 400,
        end_ms: (idx + 1) * 400,
      }));

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col bg-st-bg px-4 py-4 text-st-fg">
      {/* Top Header Navigation */}
      <div className="mb-3 flex items-center justify-between border-b-2 border-st-fg pb-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/student/${studentId}/library`}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
            aria-label="Về kệ sách"
          >
            <ArrowLeft size={16} className="text-st-fg" />
          </Link>
          <div>
            <Mono className="block text-st-muted-fg font-extrabold">
              {story.title}
            </Mono>
            <PageTitle className="text-[18px]">
              Trang {currentPageIndex + 1} / {totalPages}
            </PageTitle>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-peach transition-opacity active:opacity-70 disabled:opacity-50"
            title="Nghe audio đọc"
          >
            <Volume2 size={18} className="text-st-primary" />
          </button>
        </div>
      </div>

      {/* Page Progress bar */}
      <div className="mb-3">
        <ProgressTrack percent={((currentPageIndex + 1) / totalPages) * 100} />
      </div>

      {/* Main Illustration Card */}
      <Tile className="flex flex-1 flex-col justify-between bg-st-card p-5">
        <div>
          {/* Illustration Area */}
          <div className="mb-4 flex h-44 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-peach text-7xl shadow-inner">
            {currentPage.illustration_url || ""}
          </div>

          {/* Synchronized Text Display */}
          <div className="rounded-[2px] border-2 border-st-fg bg-st-bg p-4 leading-relaxed">
            <div className="flex flex-wrap gap-1.5 text-[18px] font-medium text-st-fg">
              {words.map((w, idx) => {
                const active = isWordActive(w);
                return (
                  <span
                    key={idx}
                    className={`rounded px-1 transition-colors duration-150 ${
                      active
                        ? "bg-st-accent font-extrabold text-st-fg scale-105"
                        : "hover:bg-st-peach"
                    }`}
                  >
                    {w.word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Micro-copy encouraging reader */}
        <div className="mt-4 border-t-2 border-st-fg pt-3 text-center">
          <p className="st-mono text-[11px] font-extrabold uppercase text-st-muted-fg flex items-center justify-center gap-1">
            <Gem size={13} className="text-st-primary" /> Read a page to earn 1 gem. Keep your daily reading streak!
          </p>
        </div>
      </Tile>

      {/* Bottom Page Navigation Controls */}
      <div className="mt-4 flex gap-2">
        <button
          disabled={currentPageIndex === 0}
          onClick={() => setCurrentPageIndex((prev) => prev - 1)}
          className="st-mono flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border-2 border-st-fg bg-st-card py-3 font-extrabold uppercase text-st-fg transition-opacity active:opacity-70 disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Previous Page
        </button>

        <button
          disabled={currentPageIndex + 1 >= totalPages}
          onClick={() => setCurrentPageIndex((prev) => prev + 1)}
          className="st-mono flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border-2 border-st-fg bg-st-primary py-3 font-extrabold uppercase text-st-primary-fg transition-opacity active:opacity-70 disabled:opacity-40"
        >
          Next Page <ArrowRight size={16} />
        </button>
      </div>

      {/* Gem Reward Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-[2px] border-2 border-st-fg bg-st-accent px-4 py-2.5 shadow-lg">
          <p className="st-display text-[13px] font-bold text-st-fg flex items-center gap-1.5">
            <Gem size={16} /> {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}
