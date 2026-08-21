"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Gem, Sparkles, XCircle } from "lucide-react";
import { markPracticeItemResolved } from "@/lib/actions/game-loop-actions";
import { BlockButton, Mono, ProgressTrack, Tile } from "@/components/student/ui";
import { KenneyStoryDialog } from "@/components/student/kenney-story-dialog";

interface Exercise {
  id: string;
  topic_id: string;
  type: string;
  content: {
    prompt?: string;
    options?: string[];
    answer?: string;
    translation?: string;
  };
  skill_tag?: string;
}

export function PracticeSessionRunner({
  studentId,
  sessionId,
  mode,
  exercises,
}: {
  studentId: string;
  sessionId: string;
  mode: "mistake_review" | "skill_boost";
  exercises: Exercise[];
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentExercise = exercises[currentIndex];
  const total = exercises.length;

  if (total === 0 || !currentExercise) {
    return (
      <div className="px-5 py-8 text-center bg-st-bg text-st-fg min-h-screen">
        <KenneyStoryDialog
          npcPose="think"
          title="Không có câu hỏi nào"
          body="Phiên ôn luyện này hiện không có câu hỏi."
          ctaLabel="Quay lại trang Ôn luyện"
          onCta={() => {
            router.push(`/student/${studentId}/practice`);
          }}
        />
      </div>
    );
  }

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || isAnswered) return;
    setIsAnswered(true);

    const correctAnswer = currentExercise.content?.answer ?? "";
    const correct = selectedOption === correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }

    if (mode === "mistake_review" && currentExercise.id) {
      try {
        await markPracticeItemResolved({
          sessionId,
          exerciseId: currentExercise.id,
          correct,
          studentId,
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setIsCompleted(true);
    }
  };

  const correctAnswer = currentExercise.content?.answer ?? "";

  return (
    <div className="px-5 pb-[125px] pt-[18px] min-h-screen bg-st-bg text-st-fg">
      {/* Top Bar */}
      <div className="mb-4 flex items-center justify-between border-b-2 border-st-fg pb-3">
        <button
          onClick={() => router.push(`/student/${studentId}/practice`)}
          className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
        >
          <ArrowLeft size={16} className="text-st-fg" />
        </button>
        <Mono className="font-extrabold text-st-fg uppercase">
          Câu {currentIndex + 1} / {total}
        </Mono>
        <Mono className="rounded-[2px] bg-st-peach px-2 py-1 font-bold text-st-primary">
          {mode === "mistake_review" ? "Sửa lỗi" : "Kỹ năng"}
        </Mono>
      </div>

      {/* Progress Bar */}
      <ProgressTrack
        percent={((currentIndex + 1) / total) * 100}
        className="mb-5"
        fillColor="var(--st-primary)"
      />

      {/* Exercise Card */}
      <Tile className="bg-st-card p-5">
        <div className="mb-4">
          <Mono className="text-st-muted-fg font-extrabold uppercase block mb-1">
            {currentExercise.skill_tag
              ? `Kỹ năng: ${currentExercise.skill_tag}`
              : "Câu hỏi ôn luyện"}
          </Mono>
          <h2 className="st-display text-[20px] text-st-fg">
            {currentExercise.content?.prompt || "Chọn đáp án đúng nhất:"}
          </h2>
          {currentExercise.content?.translation && (
            <p className="mt-1 text-[13px] text-st-muted-fg italic">
              ({currentExercise.content.translation})
            </p>
          )}
        </div>

        {/* Options Grid */}
        <div className="space-y-2.5 my-5">
          {(currentExercise.content?.options ?? ["True", "False"]).map(
            (opt, idx) => {
              const isSelected = selectedOption === opt;
              let styleClass = "bg-st-bg text-st-fg border-st-fg";
              if (isAnswered) {
                if (opt === correctAnswer) {
                  styleClass = "bg-st-secondary text-st-fg border-st-fg font-black";
                } else if (isSelected && !isCorrect) {
                  styleClass = "bg-st-destructive text-st-primary-fg border-st-fg";
                }
              } else if (isSelected) {
                styleClass = "bg-st-peach text-st-primary border-st-fg font-black";
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full rounded-[2px] border-2 p-3 text-left transition-transform active:scale-[0.98] ${styleClass}`}
                >
                  <span className="st-display text-[15px] font-bold">
                    {opt}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* Check & Continue Controls */}
        <div className="mt-6 border-t-2 border-st-fg pt-4">
          {!isAnswered ? (
            <BlockButton
              tone="primary"
              disabled={!selectedOption}
              onClick={handleCheckAnswer}
              className="w-full text-[14px]"
            >
              Kiểm tra câu trả lời
            </BlockButton>
          ) : (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 rounded-[2px] border-2 border-st-fg p-3 ${
                  isCorrect
                    ? "bg-st-secondary text-st-fg"
                    : "bg-st-destructive text-st-primary-fg"
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle size={20} />
                    <span className="font-bold text-[14px]">Chính xác! Giỏi lắm!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={20} />
                    <span className="font-bold text-[14px]">
                      Chưa đúng. Đáp án: &quot;{correctAnswer}&quot;
                    </span>
                  </>
                )}
              </div>
              <BlockButton
                tone="accent"
                onClick={handleNextQuestion}
                className="w-full text-[14px]"
              >
                {currentIndex + 1 >= total ? "Hoàn thành phiên" : "Câu tiếp theo"}
              </BlockButton>
            </div>
          )}
        </div>
      </Tile>

      {/* Session Completed Overlay */}
      {isCompleted && (
        <KenneyStoryDialog
          npcPose="cheer0"
          title="Hoàn Thành Phiên Ôn Luyện!"
          body={`Em đã trả lời đúng ${correctCount}/${total} câu hỏi!`}
          variant="overlay"
          ctaLabel="Quay lại trang Ôn luyện"
          onCta={() => {
            router.push(`/student/${studentId}/practice`);
          }}
        >
          <div className="my-4 flex justify-center gap-3 rounded-[2px] border-2 border-st-fg bg-st-peach p-3">
            <div className="flex items-center gap-1">
              <Gem size={18} className="text-st-primary" />
              <span className="st-display text-[16px] font-black text-st-fg">+40 Gems</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={18} className="text-st-accent" />
              <span className="st-display text-[16px] font-black text-st-fg">+50 XP</span>
            </div>
          </div>
        </KenneyStoryDialog>
      )}
    </div>
  );
}
