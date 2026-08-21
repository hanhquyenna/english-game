"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Gem,
  GraduationCap,
  Lightbulb,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import {
  abandonRolePlaySession,
  startRolePlaySession,
  submitRolePlayUtterance,
} from "@/lib/actions/game-loop-actions";
import { BlockButton, Mono, PageTitle, Tile } from "@/components/student/ui";
import { KenneyStoryDialog } from "@/components/student/kenney-story-dialog";

interface RolePlayTask {
  id: string;
  order: number;
  prompt_vi: string;
  keyword_hints: string[];
}

interface RolePlayTopic {
  id: string;
  title_vi: string;
  icon: string;
  cefr_band: string;
}

export function RolePlayClient({
  studentId,
  topic,
  tasks,
}: {
  studentId: string;
  topic: RolePlayTopic;
  tasks: RolePlayTask[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"card" | "room">("card");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcriptInput, setTranscriptInput] = useState("");
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; matchedTaskPrompt?: string }[]
  >([
    {
      sender: "ai",
      text: `Hello! Welcome to ${topic.title_vi}! What can you tell me about it?`,
    },
  ]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const processUtterance = async (text: string) => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const userMsg = { sender: "user" as const, text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      if (sessionId) {
        const res = await submitRolePlayUtterance({
          sessionId,
          studentId,
          transcript: text,
        });

        if (res.matchedTaskId) {
          const matchedTask = tasks.find((t) => t.id === res.matchedTaskId);
          setCompletedTaskIds((prev) => new Set([...prev, res.matchedTaskId!]));

          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: `Great job! You mentioned: "${res.matchedKeyword}"!`,
              matchedTaskPrompt: matchedTask?.prompt_vi,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "Good sentence! Try to speak one of the remaining tasks!",
            },
          ]);
        }

        if (res.isCompleted) {
          setIsCompleted(true);
        }
      }
    } catch {
      // Local fallback logic
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Nice work! Keep going!" },
      ]);
    } finally {
      setIsSubmitting(false);
      setTranscriptInput("");
    }
  };

  const handleStartSession = async () => {
    try {
      const s = await startRolePlaySession(studentId, topic.id);
      setSessionId(s.id);
      setStep("room");
    } catch {
      setSessionId(`local-${Date.now()}`);
      setStep("room");
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setTranscriptInput("");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const sampleText =
      transcriptInput.trim() ||
      (tasks[completedTaskIds.size]?.keyword_hints[0]
        ? `I have a ${tasks[completedTaskIds.size].keyword_hints[0]} in my ${topic.title_vi.toLowerCase()}`
        : "I like learning English with Rubee!");

    await processUtterance(sampleText);
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleExit = async () => {
    if (sessionId && !sessionId.startsWith("local-")) {
      await abandonRolePlaySession(sessionId);
    }
    router.push(`/student/${studentId}/roleplay`);
  };

  const handleListenToAI = () => {
    // Audio playback fallback
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col bg-st-bg px-4 py-4 text-st-fg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b-2 border-st-fg pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitDialog(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
            aria-label="Thoát"
          >
            <ArrowLeft size={16} className="text-st-fg" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">{topic.icon}</span>
              <PageTitle className="text-[20px]">{topic.title_vi}</PageTitle>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-[2px] border-2 border-st-fg bg-st-peach px-2 py-1">
            <Gem size={14} className="text-st-primary" />
            <Mono className="font-extrabold text-st-primary">+30</Mono>
          </span>
        </div>
      </div>

      {/* STEP 1: Pre-Role Card */}
      {step === "card" && (
        <div className="flex flex-1 flex-col justify-between">
          <Tile className="bg-st-card p-5">
            <div className="mb-4 text-center">
              <span className="text-5xl">{topic.icon}</span>
              <h2 className="st-display mt-2 text-[22px] text-st-fg font-black">
                Role Play Mission
              </h2>
              <Mono className="text-st-muted-fg font-bold">CEFR {topic.cefr_band}</Mono>
            </div>

            <div className="mb-5 space-y-3 border-t-2 border-b-2 border-st-fg py-4">
              <div className="flex items-center justify-between">
                <span className="st-mono text-[11px] uppercase text-st-muted-fg font-bold">
                  Your Role
                </span>
                <span className="st-display text-[14px] font-bold text-st-fg">
                  <GraduationCap size={14} className="inline" /> Student
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="st-mono text-[11px] uppercase text-st-muted-fg font-bold">
                  Speaking With
                </span>
                <span className="st-display text-[14px] font-bold text-st-primary">
                  AI Guide Mascot
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="st-mono block text-[11px] font-extrabold uppercase text-st-muted-fg">
                3 Tasks to Complete:
              </span>
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 rounded-[2px] border-2 border-st-fg bg-st-bg p-2.5"
                >
                  <span className="st-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-st-primary text-[10px] font-black text-st-primary-fg">
                    {idx + 1}
                  </span>
                  <span className="text-[13px] font-bold text-st-fg">
                    {task.prompt_vi}
                  </span>
                </div>
              ))}
            </div>
          </Tile>

          <div className="mt-4">
            <BlockButton
              tone="primary"
              onClick={handleStartSession}
              className="w-full text-[14px]"
            >
              <Sparkles size={16} /> Start Session (+30 Gems)
            </BlockButton>
          </div>
        </div>
      )}

      {/* STEP 2: Conversation Room */}
      {step === "room" && (
        <div className="flex flex-1 flex-col justify-between gap-3">
          <Tile className="flex flex-1 flex-col justify-between bg-st-card p-4">
            <div className="space-y-3 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="st-mono text-[9px] uppercase font-bold opacity-80">
                      {msg.sender === "user" ? "You" : "AI Guide Mascot"}
                    </span>
                  </div>
                  {showSubtitles ? (
                    <div
                      className={`max-w-[85%] rounded-[2px] border-2 border-st-fg p-3 shadow-xs ${
                        msg.sender === "user"
                          ? "bg-st-primary text-st-primary-fg"
                          : "bg-st-peach text-st-fg"
                      }`}
                    >
                      <p className="text-[14px] font-bold">{msg.text}</p>
                      {msg.matchedTaskPrompt && (
                        <span className="mt-1 block text-[11px] opacity-90 font-bold border-t border-st-fg/20 pt-1">
                          Completed: {msg.matchedTaskPrompt}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleListenToAI}
                      className="flex items-center gap-1.5 rounded-[2px] border-2 border-st-fg bg-st-peach px-3 py-2 text-[13px] font-bold text-st-fg"
                    >
                      <Volume2 size={16} /> Tap to listen
                    </button>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <div className="mt-3 flex justify-between border-t-2 border-st-fg pt-2">
              <button
                onClick={() => setShowSubtitles((prev) => !prev)}
                className="st-mono text-[11px] font-extrabold uppercase text-st-muted-fg hover:text-st-fg"
              >
                {showSubtitles ? "Hide Subtitles" : "Show Subtitles"}
              </button>
              <button
                onClick={() => setShowHint((prev) => !prev)}
                className="st-mono text-[11px] font-extrabold uppercase text-st-primary hover:underline flex items-center gap-1"
              >
                <Lightbulb size={12} /> {showHint ? "Hide Hint" : "Show Sample Hint"}
              </button>
            </div>
          </Tile>

          {showHint && (
            <div className="rounded-[2px] border-2 border-st-fg bg-st-accent p-2.5 text-st-fg">
              <div className="flex items-center justify-between mb-1">
                <span className="st-mono text-[10px] font-black uppercase flex items-center gap-1">
                  <Lightbulb size={13} /> Sample English Hint
                </span>
                <button onClick={() => setShowHint(false)}>
                  <X size={14} />
                </button>
              </div>
              <p className="text-[12px] font-bold">
                &quot;In my {topic.title_vi.toLowerCase()}, I can see a big desk and chairs.&quot;
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={transcriptInput}
                onChange={(e) => setTranscriptInput(e.target.value)}
                placeholder="Type or preview speaking transcript..."
                className="flex-1 rounded-[2px] border-2 border-st-fg bg-st-card px-3 py-2 text-[13px] font-bold text-st-fg outline-none"
              />
              <BlockButton
                tone="primary"
                onClick={() => processUtterance(transcriptInput)}
                disabled={isSubmitting || !transcriptInput.trim()}
                className="px-4 text-[12px]"
              >
                Send
              </BlockButton>
            </div>

            <div className="flex flex-col items-center gap-1.5 pt-1">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-st-fg bg-st-primary text-st-primary-fg shadow-md transition-transform active:scale-90"
                >
                  <Mic size={26} />
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-st-fg bg-st-destructive text-st-primary-fg shadow-md animate-pulse active:scale-90"
                >
                  <MicOff size={26} />
                </button>
              )}
              <Mono className="font-extrabold text-st-fg">
                {isRecording
                  ? `Recording (${recordingSeconds}s / 60s) — Tap to stop`
                  : "Tap mic button to speak English"}
              </Mono>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isCompleted && (
        <KenneyStoryDialog
          npcPose="cheer0"
          title="Awesome! Mission Completed!"
          body="You completed all 3 speaking tasks with your AI Guide Mascot!"
          variant="overlay"
          ctaLabel="Claim Reward & Return"
          onCta={handleExit}
        >
          <div className="my-4 flex justify-center gap-3 rounded-[2px] border-2 border-st-fg bg-st-peach p-3">
            <div className="flex items-center gap-1">
              <Gem size={18} className="text-st-primary" />
              <span className="st-display text-[16px] font-black text-st-fg">+30 Gems</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={18} className="text-st-accent" />
              <span className="st-display text-[16px] font-black text-st-fg">+50 XP</span>
            </div>
          </div>
        </KenneyStoryDialog>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <KenneyStoryDialog
          npcPose="think"
          title="Are you sure you want to exit?"
          body="Your current role play progress will not be saved if you leave now."
          variant="overlay"
          secondaryLabel="Keep Learning"
          onSecondary={() => setShowExitDialog(false)}
          ctaLabel="Exit Session"
          onCta={handleExit}
        />
      )}
    </div>
  );
}
