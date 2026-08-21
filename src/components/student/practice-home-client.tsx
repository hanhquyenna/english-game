"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { SKILL_LABELS, SkillTag, calculateSkillStars } from "@/lib/game-loop";
import { createPracticeSession } from "@/lib/actions/game-loop-actions";
import { BlockButton, Mono, PageTitle, Tile } from "@/components/student/ui";
import { KenneyStoryDialog } from "@/components/student/kenney-story-dialog";

interface ExerciseItem {
  id: string;
  topic_id: string;
  type: string;
  content: unknown;
  skill_tag?: string;
}

interface PracticeHomeProps {
  studentId: string;
  mistakes: ExerciseItem[];
  attempts: { skillTag: string; correct: boolean }[];
}

export function PracticeHomeClient({
  studentId,
  mistakes,
  attempts,
}: PracticeHomeProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mistakes" | "skills">("mistakes");
  const [selectedSkills, setSelectedSkills] = useState<SkillTag[]>(["tu_vung"]);
  const [showPreview, setShowPreview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const skillKeys: SkillTag[] = [
    "nghe",
    "noi",
    "phat_am",
    "tu_vung",
    "ngu_phap",
    "doc",
    "viet",
  ];

  const SKILL_ENGLISH_LABELS: Record<SkillTag, string> = {
    nghe: "Listening",
    noi: "Speaking",
    phat_am: "Pronunciation",
    tu_vung: "Vocabulary",
    ngu_phap: "Grammar",
    doc: "Reading",
    viet: "Writing",
  };

  const handleToggleSkill = (tag: SkillTag) => {
    setSelectedSkills((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const mode = activeTab === "mistakes" ? "mistake_review" : "skill_boost";
      const tags = activeTab === "skills" ? selectedSkills : undefined;
      const res = await createPracticeSession({
        studentId,
        mode,
        skillTags: tags,
      });

      if (res.sessionId) {
        router.push(
          `/student/${studentId}/practice/session?sessionId=${res.sessionId}&mode=${mode}`,
        );
      } else {
        setShowPreview(true);
      }
    } catch {
      setShowPreview(true);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/student/${studentId}`}
          className="flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-st-fg" />
        </Link>
        <PageTitle className="flex-1">Practice Center</PageTitle>
      </div>

      {/* Mode Selector Tabs */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => {
            setActiveTab("mistakes");
            setShowPreview(false);
          }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-[2px] border-2 border-st-fg p-3 transition-colors ${
            activeTab === "mistakes"
              ? "bg-st-primary text-st-primary-fg"
              : "bg-st-card text-st-fg"
          }`}
        >
          <RotateCcw size={20} />
          <span className="st-display text-[15px] font-bold">Review Mistakes</span>
          <Mono className={activeTab === "mistakes" ? "text-st-primary-fg opacity-90" : "text-st-muted-fg"}>
            {mistakes.length} items to review
          </Mono>
        </button>

        <button
          onClick={() => {
            setActiveTab("skills");
            setShowPreview(false);
          }}
          className={`flex flex-1 flex-col items-center gap-1 rounded-[2px] border-2 border-st-fg p-3 transition-colors ${
            activeTab === "skills"
              ? "bg-st-primary text-st-primary-fg"
              : "bg-st-card text-st-fg"
          }`}
        >
          <Target size={20} />
          <span className="st-display text-[15px] font-bold">Skill Boost</span>
          <Mono className={activeTab === "skills" ? "text-st-primary-fg opacity-90" : "text-st-muted-fg"}>
            7 mastery skills
          </Mono>
        </button>
      </div>

      {/* MODE 1: Mistake Review */}
      {activeTab === "mistakes" && (
        <div className="space-y-4">
          {mistakes.length === 0 ? (
            <KenneyStoryDialog
              npcPose="cheer0"
              title="Awesome! No mistakes found!"
              body="You have cleared all past mistakes. Learn new topics or try Skill Boost!"
            />
          ) : !showPreview ? (
            <Tile className="bg-st-card p-5">
              <div className="mb-3 flex items-center justify-between border-b-2 border-st-fg pb-3">
                <span className="st-display text-[18px] text-st-fg flex items-center gap-2 font-black">
                  <RotateCcw size={18} className="text-st-primary" /> Mistake Review Preview
                </span>
                <Mono className="rounded-[2px] bg-st-peach px-2 py-0.5 text-st-primary font-bold">
                  {mistakes.length} items
                </Mono>
              </div>

              <div className="grid grid-cols-3 gap-2 my-4 text-center">
                <div className="rounded-[2px] border-2 border-st-fg bg-st-bg p-2">
                  <Mono className="block text-st-muted-fg">Questions</Mono>
                  <span className="st-display text-[16px] font-bold text-st-fg">
                    {mistakes.length} items
                  </span>
                </div>
                <div className="rounded-[2px] border-2 border-st-fg bg-st-bg p-2">
                  <Mono className="block text-st-muted-fg">Est. Time</Mono>
                  <span className="st-display text-[16px] font-bold text-st-fg">
                    ~{Math.max(2, Math.ceil(mistakes.length * 0.8))} mins
                  </span>
                </div>
                <div className="rounded-[2px] border-2 border-st-fg bg-st-bg p-2">
                  <Mono className="block text-st-muted-fg">Reward</Mono>
                  <span className="st-display text-[16px] font-bold text-st-primary">
                    +50 Gems
                  </span>
                </div>
              </div>

              <BlockButton
                tone="primary"
                onClick={handleStartSession}
                disabled={isStarting}
                className="w-full text-[13px]"
              >
                <Sparkles size={16} /> {isStarting ? "Creating session..." : "Start Reviewing Now"}
              </BlockButton>
            </Tile>
          ) : null}
        </div>
      )}

      {/* MODE 2: Skill Boost */}
      {activeTab === "skills" && (
        <div className="space-y-4">
          <p className="text-[13px] text-st-muted-fg font-medium">
            Select at least 1 skill to practice. Stars represent your recent mastery level:
          </p>

          {/* 7 Skill Tiles Grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skillKeys.map((tag) => {
              const stars = calculateSkillStars(attempts, tag);
              const isSelected = selectedSkills.includes(tag);
              return (
                <div
                  key={tag}
                  onClick={() => handleToggleSkill(tag)}
                  className={`flex cursor-pointer items-center justify-between rounded-[2px] border-2 border-st-fg p-3 transition-colors ${
                    isSelected ? "bg-st-peach border-st-fg" : "bg-st-card"
                  }`}
                >
                  <div>
                    <span className="st-display block text-[15px] font-bold text-st-fg">
                      {SKILL_ENGLISH_LABELS[tag]}
                    </span>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < stars
                              ? "text-st-accent fill-st-accent"
                              : "text-st-muted-fg"
                          }
                        />
                      ))}
                      <Mono className="ml-1 text-st-muted-fg">
                        ({stars}/5 stars)
                      </Mono>
                    </div>
                  </div>

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-[2px] border-2 border-st-fg ${
                      isSelected ? "bg-st-primary text-st-primary-fg" : "bg-st-bg"
                    }`}
                  >
                    {isSelected && <CheckCircle size={14} />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <BlockButton
              tone="primary"
              onClick={handleStartSession}
              disabled={selectedSkills.length === 0 || isStarting}
              className="w-full text-[13px]"
            >
              <Target size={16} />{" "}
              {selectedSkills.length === 0
                ? "Select at least 1 skill"
                : isStarting
                  ? "Creating session..."
                  : `Start Practice (${selectedSkills.length} skills)`}
            </BlockButton>
          </div>
        </div>
      )}
    </div>
  );
}
