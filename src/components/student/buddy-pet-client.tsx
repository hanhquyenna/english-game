"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Gem, Heart, Star } from "lucide-react";
import { feedPet, getOrCreateStudentPet } from "@/lib/actions/game-loop-actions";
import { BlockButton, Mono, PageTitle, ProgressTrack, Tile } from "@/components/student/ui";
import { KenneyStoryDialog, npcSrc } from "@/components/student/kenney-story-dialog";

interface PetData {
  id: string;
  stage: number;
  happiness: number;
  last_fed_at?: string;
  streak: number;
}

/** Maps pet stage to a Kenney NPC pose for visual progression */
const STAGE_POSES: Record<number, { pose: string; label: string }> = {
  1: { pose: "idle", label: "Baby Bee Explorer" },
  2: { pose: "cheer0", label: "Adult Bee Guide" },
  3: { pose: "cheer1", label: "Super Cosmic Bee" },
};

export function BuddyPetClient({ studentId }: { studentId: string }) {
  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [feedCountToday, setFeedCountToday] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPetWithTimeout = async () => {
    setIsLoading(true);
    setIsError(false);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout 8s")), 8000),
    );

    try {
      const dataPromise = getOrCreateStudentPet(studentId);
      const res = (await Promise.race([dataPromise, timeoutPromise])) as PetData;
      setPet(res);

      if (res.last_fed_at) {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (res.last_fed_at.slice(0, 10) === todayStr) {
          setFeedCountToday(1);
        }
      }
    } catch {
      setIsError(true);
      setPet({
        id: "fallback-pet",
        stage: 1,
        happiness: 80,
        streak: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPetWithTimeout();
  }, [studentId]);

  const handleFeed = async () => {
    if (!pet || isFeeding) return;
    if (feedCountToday >= 3) {
      showToast("Pet is full for today! Come back tomorrow.");
      return;
    }

    setIsFeeding(true);
    try {
      const res = await feedPet(studentId, pet.id, 5);
      if (res.success) {
        setPet((prev) =>
          prev ? { ...prev, happiness: res.newHappiness ?? prev.happiness + 10 } : null,
        );
        setFeedCountToday((prev) => prev + 1);
        showToast("Fed your pet! +10 Happiness");
      } else {
        showToast(res.message || "Not enough gems to feed pet!");
      }
    } catch {
      showToast("An error occurred, please try again!");
    } finally {
      setIsFeeding(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const streak = pet?.streak ?? 0;
  const stage = pet?.stage ?? 1;
  const happiness = pet?.happiness ?? 80;
  const isSad = streak === 0;

  const stageInfo = STAGE_POSES[stage] ?? STAGE_POSES[1];
  const currentPose = isSad ? "hurt" : stageInfo.pose;

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/student/${studentId}`}
          className="flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-st-fg" />
        </Link>
        <PageTitle className="flex-1">Buddy Companion</PageTitle>
      </div>

      {isLoading ? (
        <Tile className="bg-st-card p-6 text-center animate-pulse">
          <div className="mx-auto mb-4 h-32 w-32 rounded-[2px] bg-st-peach flex items-center justify-center">
            <img
              src="/kenney/tiny-town/Tiles/tile_0094.png"
              alt=""
              className="h-12 w-12"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
          <Mono className="text-st-muted-fg font-extrabold block">
            Loading pet data...
          </Mono>
        </Tile>
      ) : isError ? (
        <KenneyStoryDialog
          npcPose="hurt"
          title="Failed to load pet data"
          body="Network connection issue. Would you like to try again?"
          ctaLabel="Retry Now"
          onCta={fetchPetWithTimeout}
        />
      ) : (
        <div className="space-y-4">
          {/* Main Pet Display Card */}
          <Tile className="bg-st-card p-5 text-center">
            <div className="mb-2 flex justify-between items-center">
              <span className="flex items-center gap-1 rounded-[2px] border-2 border-st-fg bg-st-peach px-2 py-1">
                <Flame size={14} className="text-st-primary" />
                <Mono className="font-extrabold text-st-fg">
                  Streak: {streak} days
                </Mono>
              </span>
              <span className="flex items-center gap-1 rounded-[2px] border-2 border-st-fg bg-st-accent px-2 py-1">
                <Star size={14} className="text-st-fg" />
                <Mono className="font-extrabold text-st-fg">
                  Pet Level: Stage {stage}
                </Mono>
              </span>
            </div>

            {/* Pet Mascot Hero Area */}
            <div className="my-4 flex h-40 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-peach shadow-inner relative overflow-hidden">
              <img
                src={npcSrc(currentPose)}
                alt={stageInfo.label}
                className="h-full object-contain animate-bounce"
                style={{ imageRendering: "auto" }}
              />
              {isSad && (
                <div className="absolute bottom-2 left-2 rounded-[2px] border-2 border-st-fg bg-st-bg px-2 py-0.5">
                  <Mono className="text-st-destructive font-black">
                    Pet is sad because streak was lost!
                  </Mono>
                </div>
              )}
            </div>

            <h2 className="st-display text-[20px] text-st-fg mb-1">
              {stageInfo.label}
            </h2>
            <p className="text-[12px] text-st-muted-fg mb-4 font-medium">
              {isSad
                ? "Maintain your daily learning streak to make your pet happy again!"
                : "Keep up your daily streak to evolve your pet to the next stage!"}
            </p>

            {/* Happiness Progress Bar */}
            <div className="rounded-[2px] border-2 border-st-fg bg-st-bg p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="st-mono text-[11px] font-extrabold uppercase text-st-fg flex items-center gap-1">
                  <Heart size={14} className="text-st-destructive fill-st-destructive" /> Happiness
                </span>
                <Mono className="font-extrabold text-st-fg">{happiness} / 100</Mono>
              </div>
              <ProgressTrack percent={happiness} fillColor="var(--st-primary)" />
            </div>
          </Tile>

          {/* Feed Pet Action Box */}
          <Tile className="bg-st-card p-4 border-2 border-st-fg">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="st-display text-[16px] text-st-fg font-black">Feed Pet</h3>
                <Mono className="text-st-muted-fg font-bold">Costs 5 Gems • Max 3 times/day</Mono>
              </div>
              <Mono className="rounded-[2px] bg-st-peach px-2 py-1 font-black text-st-primary">
                Times Fed: {feedCountToday}/3
              </Mono>
            </div>

            <BlockButton
              tone="accent"
              disabled={feedCountToday >= 3 || isFeeding}
              onClick={handleFeed}
              className="w-full text-[13px]"
            >
              <Gem size={16} />{" "}
              {feedCountToday >= 3
                ? "Pet is full for today! Come back tomorrow."
                : isFeeding
                  ? "Feeding..."
                  : "Feed Pet (-5 Gems)"}
            </BlockButton>
          </Tile>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-[2px] border-2 border-st-fg bg-st-accent px-4 py-2.5 shadow-lg">
          <p className="st-display text-[13px] font-bold text-st-fg">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}
