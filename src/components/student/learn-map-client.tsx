"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Globe,
  Lock,
  LogOut,
  Medal,
  PenLine,
  Sparkles,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { Mono } from "@/components/student/ui";
import { StudentAvatar } from "@/components/student-avatar";
import type { Island } from "@/lib/islands";

export type WorldLessonNode = {
  id: string;
  topicId: string;
  number: number;
  globalLessonNumber: number;
  name: string;
  subtitle: string;
  percentComplete: number;
  isUnlocked: boolean;
  isExam: boolean;
  x: number; // percentage along horizontal road
  y: number; // percentage along vertical winding curve
};

export type GameWorld = {
  id: number;
  name: string;
  subtitle: string;
  bgImage: string;
  themeBadge: string;
  unlocked: boolean;
  lessons: WorldLessonNode[];
};

export function LearnMapClient({
  studentId,
  seed,
  overrides,
  gems,
  streak,
  levelNumber,
  cefrBand,
  islands,
}: {
  studentId: string;
  seed: string;
  overrides?: any;
  gems: number;
  streak: number;
  levelNumber: number;
  cefrBand: string;
  islands: Island[];
}) {
  const router = useRouter();
  const [currentWorldId, setCurrentWorldId] = useState<number>(1);
  const [selectedNodeModal, setSelectedNodeModal] = useState<WorldLessonNode | null>(null);
  const [showExpModal, setShowExpModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 8 Unique Craftpix Nature Pixel Art Worlds Definition (6 Lessons + 1 Final Boss Exam per World)
  const worldsData: GameWorld[] = [
    {
      id: 1,
      name: "World 1: Green Forest Realm",
      subtitle: "Beginner CEFR A1 Fundamentals",
      bgImage: "/craftpix/nature-backgrounds/nature_1/origbig.png",
      themeBadge: "bg-st-secondary border-st-fg text-st-primary-fg",
      unlocked: true,
      lessons: [
        { id: "w1-l1", topicId: islands[0]?.topicId ?? "unit-1", number: 1, globalLessonNumber: 1, name: "Lesson 1: Greetings & Intro", subtitle: "Basic Greetings & Introductions", percentComplete: 100, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w1-l2", topicId: islands[1]?.topicId ?? "unit-2", number: 2, globalLessonNumber: 2, name: "Lesson 2: Family & Friends", subtitle: "Talking about Family Members", percentComplete: 57, isUnlocked: true, isExam: false, x: 30, y: 65 },
        { id: "w1-l3", topicId: islands[2]?.topicId ?? "unit-3", number: 3, globalLessonNumber: 3, name: "Lesson 3: Hobbies & Sports", subtitle: "Free Time & Sports Vocabulary", percentComplete: 0, isUnlocked: true, isExam: false, x: 45, y: 38 },
        { id: "w1-l4", topicId: "unit-4", number: 4, globalLessonNumber: 4, name: "Lesson 4: School & Daily Routine", subtitle: "School Subjects & Timetables", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w1-l5", topicId: "unit-5", number: 5, globalLessonNumber: 5, name: "Lesson 5: Food & Dining Out", subtitle: "Ordering Food & Drinks", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w1-l6", topicId: "unit-6", number: 6, globalLessonNumber: 6, name: "Lesson 6: Travel & Airport", subtitle: "Airport & Hotel Conversations", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w1-boss", topicId: "exam-w1", number: 7, globalLessonNumber: 7, name: "World 1 Final Boss Exam", subtitle: "CEFR Unit 1 Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 2,
      name: "World 2: Blossom Valley Realm",
      subtitle: "CEFR A1 Expansion & Vocabulary",
      bgImage: "/craftpix/nature-backgrounds/nature_2/origbig.png",
      themeBadge: "bg-st-peach border-st-fg text-st-fg",
      unlocked: true,
      lessons: [
        { id: "w2-l1", topicId: "w2-unit-1", number: 1, globalLessonNumber: 8, name: "Lesson 7: Shopping & Clothes", subtitle: "Prices, Clothing & Stores", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w2-l2", topicId: "w2-unit-2", number: 2, globalLessonNumber: 9, name: "Lesson 8: Health & Body", subtitle: "Medical Terms & Staying Healthy", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w2-l3", topicId: "w2-unit-3", number: 3, globalLessonNumber: 10, name: "Lesson 9: Jobs & Careers", subtitle: "Professions & Workplace English", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w2-l4", topicId: "w2-unit-4", number: 4, globalLessonNumber: 11, name: "Lesson 10: Weather & Seasons", subtitle: "Climate & Seasonal Activity", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w2-l5", topicId: "w2-unit-5", number: 5, globalLessonNumber: 12, name: "Lesson 11: Technology & Web", subtitle: "Devices, Internet & Social Media", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w2-l6", topicId: "w2-unit-6", number: 6, globalLessonNumber: 13, name: "Lesson 12: Music & Movies", subtitle: "Entertainment & Instruments", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w2-boss", topicId: "exam-w2", number: 7, globalLessonNumber: 14, name: "World 2 Final Boss Exam", subtitle: "CEFR Unit 2 Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 3,
      name: "World 3: Misty Mountain Realm",
      subtitle: "CEFR A2 Elementary Grammar",
      bgImage: "/craftpix/nature-backgrounds/nature_3/origbig.png",
      themeBadge: "bg-st-muted border-st-fg text-st-fg",
      unlocked: true,
      lessons: [
        { id: "w3-l1", topicId: "w3-unit-1", number: 1, globalLessonNumber: 15, name: "Lesson 13: Environment & Nature", subtitle: "Animals & Saving the Planet", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w3-l2", topicId: "w3-unit-2", number: 2, globalLessonNumber: 16, name: "Lesson 14: Future Dreams & Goals", subtitle: "Expressing Future Intentions", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w3-l3", topicId: "w3-unit-3", number: 3, globalLessonNumber: 17, name: "Lesson 15: Past Experiences", subtitle: "Simple Past Tense Narratives", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w3-l4", topicId: "w3-unit-4", number: 4, globalLessonNumber: 18, name: "Lesson 16: Directions & Maps", subtitle: "Navigating Cities & Towns", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w3-l5", topicId: "w3-unit-5", number: 5, globalLessonNumber: 19, name: "Lesson 17: Comparisons & Preferences", subtitle: "Better, Faster, Stronger", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w3-l6", topicId: "w3-unit-6", number: 6, globalLessonNumber: 20, name: "Lesson 18: Opinions & Debates", subtitle: "Agreeing & Disagreeing Polite Phrases", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w3-boss", topicId: "exam-w3", number: 7, globalLessonNumber: 21, name: "World 3 Final Boss Exam", subtitle: "CEFR A2 Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 4,
      name: "World 4: Twilight Woodland Realm",
      subtitle: "CEFR A2+ Advanced Structures",
      bgImage: "/craftpix/nature-backgrounds/nature_4/origbig.png",
      themeBadge: "bg-st-primary border-st-fg text-st-primary-fg",
      unlocked: true,
      lessons: [
        { id: "w4-l1", topicId: "w4-unit-1", number: 1, globalLessonNumber: 22, name: "Lesson 19: Storytelling & Myths", subtitle: "Narrative Tenses & Fiction", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w4-l2", topicId: "w4-unit-2", number: 2, globalLessonNumber: 23, name: "Lesson 20: Science & Discoveries", subtitle: "Inventions & Scientific Facts", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w4-l3", topicId: "w4-unit-3", number: 3, globalLessonNumber: 24, name: "Lesson 21: Art & Culture", subtitle: "Museums, Music & Traditions", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w4-l4", topicId: "w4-unit-4", number: 4, globalLessonNumber: 25, name: "Lesson 22: Feelings & Emotions", subtitle: "Describing Moods & Mindsets", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w4-l5", topicId: "w4-unit-5", number: 5, globalLessonNumber: 26, name: "Lesson 23: Business Essentials", subtitle: "Emails & Formal Tone", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w4-l6", topicId: "w4-unit-6", number: 6, globalLessonNumber: 27, name: "Lesson 24: Travel Logistics", subtitle: "Visas, Customs & Transport", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w4-boss", topicId: "exam-w4", number: 7, globalLessonNumber: 28, name: "World 4 Final Boss Exam", subtitle: "CEFR A2+ Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 5,
      name: "World 5: Mystic Grove Realm",
      subtitle: "CEFR B1 Intermediate Fluency",
      bgImage: "/craftpix/nature-backgrounds/nature_5/origbig.png",
      themeBadge: "bg-st-secondary border-st-accent text-st-primary-fg",
      unlocked: true,
      lessons: [
        { id: "w5-l1", topicId: "w5-unit-1", number: 1, globalLessonNumber: 29, name: "Lesson 25: Hypotheses & Conditions", subtitle: "If Clauses & Conditionals", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w5-l2", topicId: "w5-unit-2", number: 2, globalLessonNumber: 30, name: "Lesson 26: Media & News Analysis", subtitle: "Headlines & Reporting", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w5-l3", topicId: "w5-unit-3", number: 3, globalLessonNumber: 31, name: "Lesson 27: Global Issues & Climate", subtitle: "Sustainability Discussions", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w5-l4", topicId: "w5-unit-4", number: 4, globalLessonNumber: 32, name: "Lesson 28: Psychology & Behavior", subtitle: "Mind, Habits & Personality", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w5-l5", topicId: "w5-unit-5", number: 5, globalLessonNumber: 33, name: "Lesson 29: Problem Solving", subtitle: "Negotiations & Solutions", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w5-l6", topicId: "w5-unit-6", number: 6, globalLessonNumber: 34, name: "Lesson 30: Public Speaking", subtitle: "Presentations & Speeches", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w5-boss", topicId: "exam-w5", number: 7, globalLessonNumber: 35, name: "World 5 Final Boss Exam", subtitle: "CEFR B1 Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 6,
      name: "World 6: Golden Savanna Realm",
      subtitle: "CEFR B1+ Professional Mastery",
      bgImage: "/craftpix/nature-backgrounds/nature_6/origbig.png",
      themeBadge: "bg-st-accent border-st-fg text-st-fg",
      unlocked: true,
      lessons: [
        { id: "w6-l1", topicId: "w6-unit-1", number: 1, globalLessonNumber: 36, name: "Lesson 31: Advanced Idioms", subtitle: "Native Metaphors & Sayings", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w6-l2", topicId: "w6-unit-2", number: 2, globalLessonNumber: 37, name: "Lesson 32: Nuanced Writing", subtitle: "Essays & Persuasive Logic", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w6-l3", topicId: "w6-unit-3", number: 3, globalLessonNumber: 38, name: "Lesson 33: Phrasal Verbs Deep Dive", subtitle: "Mastering Verb Particles", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w6-l4", topicId: "w6-unit-4", number: 4, globalLessonNumber: 39, name: "Lesson 34: Academic Vocabulary", subtitle: "Research & Data Synthesis", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w6-l5", topicId: "w6-unit-5", number: 5, globalLessonNumber: 40, name: "Lesson 35: Intercultural Communication", subtitle: "Global Etiquette & Nuances", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w6-l6", topicId: "w6-unit-6", number: 6, globalLessonNumber: 41, name: "Lesson 36: Debate & Argumentation", subtitle: "Defending Complex Positions", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w6-boss", topicId: "exam-w6", number: 7, globalLessonNumber: 42, name: "World 6 Final Boss Exam", subtitle: "CEFR B1+ Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 7,
      name: "World 7: Autumn Pine Realm",
      subtitle: "CEFR B2 Upper-Intermediate Fluency",
      bgImage: "/craftpix/nature-backgrounds/nature_7/origbig.png",
      themeBadge: "bg-st-destructive border-st-fg text-st-primary-fg",
      unlocked: true,
      lessons: [
        { id: "w7-l1", topicId: "w7-unit-1", number: 1, globalLessonNumber: 43, name: "Lesson 37: Complex Syntax & Style", subtitle: "Inversion & Emphasis", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w7-l2", topicId: "w7-unit-2", number: 2, globalLessonNumber: 44, name: "Lesson 38: Literary Analysis", subtitle: "Prose, Poetry & Irony", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w7-l3", topicId: "w7-unit-3", number: 3, globalLessonNumber: 45, name: "Lesson 39: Technical & IT English", subtitle: "Software, Architecture & AI", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w7-l4", topicId: "w7-unit-4", number: 4, globalLessonNumber: 46, name: "Lesson 40: Legal & Financial Concepts", subtitle: "Contracts & Market Dynamics", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w7-l5", topicId: "w7-unit-5", number: 5, globalLessonNumber: 47, name: "Lesson 41: Advanced Listening Skills", subtitle: "Fast Native Accents & Dialects", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w7-l6", topicId: "w7-unit-6", number: 6, globalLessonNumber: 48, name: "Lesson 42: Creative Writing Masterclass", subtitle: "Metaphors, Tone & Voice", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w7-boss", topicId: "exam-w7", number: 7, globalLessonNumber: 49, name: "World 7 Final Boss Exam", subtitle: "CEFR B2 Boss Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
    {
      id: 8,
      name: "World 8: Celestial Night Realm",
      subtitle: "CEFR C1 Native Master Level",
      bgImage: "/craftpix/nature-backgrounds/nature_8/origbig.png",
      themeBadge: "bg-st-primary border-st-accent text-st-primary-fg",
      unlocked: true,
      lessons: [
        { id: "w8-l1", topicId: "w8-unit-1", number: 1, globalLessonNumber: 50, name: "Lesson 43: Native Subtleties & Irony", subtitle: "Humor, Sarcasm & Understatement", percentComplete: 0, isUnlocked: true, isExam: false, x: 15, y: 38 },
        { id: "w8-l2", topicId: "w8-unit-2", number: 2, globalLessonNumber: 51, name: "Lesson 44: Philosophy & Ethics", subtitle: "Abstract Reasoning & Discourse", percentComplete: 0, isUnlocked: false, isExam: false, x: 30, y: 65 },
        { id: "w8-l3", topicId: "w8-unit-3", number: 3, globalLessonNumber: 52, name: "Lesson 45: Executive Diplomacy", subtitle: "High-Stakes Negotiations", percentComplete: 0, isUnlocked: false, isExam: false, x: 45, y: 38 },
        { id: "w8-l4", topicId: "w8-unit-4", number: 4, globalLessonNumber: 53, name: "Lesson 46: Scientific Publishing", subtitle: "Peer-Reviewed Writing", percentComplete: 0, isUnlocked: false, isExam: false, x: 60, y: 65 },
        { id: "w8-l5", topicId: "w8-unit-5", number: 5, globalLessonNumber: 54, name: "Lesson 47: Rhetoric & Oratory", subtitle: "Mastering Persuasive Eloquence", percentComplete: 0, isUnlocked: false, isExam: false, x: 73, y: 38 },
        { id: "w8-l6", topicId: "w8-unit-6", number: 6, globalLessonNumber: 55, name: "Lesson 48: Linguistic Precision", subtitle: "Etymology & Precision", percentComplete: 0, isUnlocked: false, isExam: false, x: 84, y: 65 },
        { id: "w8-boss", topicId: "exam-w8", number: 7, globalLessonNumber: 56, name: "World 8 Grand Master Exam", subtitle: "CEFR C1 Grand Master Assessment", percentComplete: 0, isUnlocked: false, isExam: true, x: 92, y: 40 },
      ],
    },
  ];

  const activeWorld = worldsData.find((w) => w.id === currentWorldId) ?? worldsData[0];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [currentWorldId]);

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#132414] select-none font-sans flex flex-col">
      {/* FLOATING TOP GAME HUD OVERLAY */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Top-Left: Level Capsule with Clickable Profile Avatar */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full border-2 border-st-fg bg-black/85 p-1.5 pr-4 shadow-2xl backdrop-blur-md">
          <Link href={`/student/${studentId}/profile`}>
            <button className="flex size-9 items-center justify-center rounded-full border-2 border-st-fg bg-st-peach shadow-md transition-transform active:scale-95 hover:ring-2 hover:ring-st-primary overflow-hidden">
              <StudentAvatar
                seed={seed}
                overrides={overrides}
                size={32}
                shape="circle"
              />
            </button>
          </Link>

          <button
            onClick={() => setShowExpModal(true)}
            className="flex flex-col items-start text-left transition-transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="st-display text-xs font-black text-st-accent uppercase tracking-wide">
                Level {levelNumber}
              </span>
              <Mono className="text-[9px] font-black text-white">420 / 600 EXP</Mono>
            </div>
            <div className="w-32 h-2 rounded-full bg-black/60 border border-st-accent/60 overflow-hidden p-0.5 mt-0.5">
              <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent/60 shadow-sm w-[70%]" />
            </div>
          </button>
        </div>

        {/* TOP CENTER: WORLD SELECTOR TAB CONTROLS */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border-2 border-st-fg bg-black/85 p-1.5 shadow-2xl backdrop-blur-md overflow-x-auto max-w-[50vw] scrollbar-none">
          <button
            onClick={() => setCurrentWorldId((prev) => Math.max(1, prev - 1))}
            disabled={currentWorldId === 1}
            className="p-1 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          {worldsData.map((world) => (
            <button
              key={world.id}
              onClick={() => setCurrentWorldId(world.id)}
              className={`px-3 py-1 rounded-full text-xs font-black transition-transform active:scale-95 whitespace-nowrap flex items-center gap-1 border ${
                currentWorldId === world.id
                  ? "bg-st-accent text-st-fg border-st-fg shadow-md scale-105"
                  : "bg-black/40 text-white/80 border-white/10 hover:bg-white/10"
              }`}
            >
              <span>W{world.id}</span>
            </button>
          ))}

          <button
            onClick={() => setCurrentWorldId((prev) => Math.min(worldsData.length, prev + 1))}
            disabled={currentWorldId === worldsData.length}
            className="p-1 rounded-full text-white hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Top-Right: Streak & World Indicator */}
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border-2 border-st-fg bg-st-accent px-3 py-1.5 shadow-xl backdrop-blur-md">
            <Flame size={15} className="text-st-fg" />
            <Mono className="text-xs font-black text-st-fg">{streak}d streak</Mono>
          </span>
        </div>
      </div>

      {/* BOTTOM-LEFT CORNER: QUIT TO MAP BUTTON */}
      <div className="absolute bottom-4 left-4 z-40">
        <Link href={`/student/${studentId}`}>
          <button className="flex items-center gap-2 rounded-2xl border-3 border-st-fg bg-st-primary px-4 py-2.5 text-xs font-black text-st-primary-fg uppercase shadow-2xl transition-transform active:scale-95 hover:scale-105">
            <LogOut size={16} />
            <span>QUIT TO MAP</span>
          </button>
        </Link>
      </div>

      {/* CURRENT WORLD TITLE BADGE OVERLAY */}
      <div className="absolute top-20 left-6 z-30 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-md border-2 border-st-accent/60 px-4 py-2 rounded-2xl shadow-2xl space-y-0.5">
          <span className="st-display text-base font-black text-st-accent block">
            {activeWorld.name}
          </span>
          <Mono className="text-[10px] text-white/80 font-bold block">
            {activeWorld.subtitle} • 6 Lessons + 1 Final Boss Exam
          </Mono>
        </div>
      </div>

      {/* CRAFTPIX MULTI-WORLD NATURE PIXEL ART CANVAS */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 w-full overflow-x-auto overflow-y-hidden scrollbar-none cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative h-full overflow-hidden transition-all duration-300"
          style={{
            width: "2800px",
            minHeight: "100%",
            backgroundImage: `url(${activeWorld.bgImage})`,
            backgroundRepeat: "repeat-x",
            backgroundSize: "cover",
            backgroundPosition: "left top",
          }}
        >
          {/* SVG GOLDEN ROADWAY TRACK CONNECTING THE 7 STATIONS IN THIS WORLD */}
          <svg
            className="absolute inset-0 h-full pointer-events-none z-10"
            style={{ width: "2800px" }}
          >
            {/* Outer Dark Road Border */}
            <path
              d={activeWorld.lessons.reduce((acc, curr, idx) => {
                const px = (curr.x / 100) * 2800;
                if (idx === 0) return `M ${px} ${curr.y}%`;
                const prev = activeWorld.lessons[idx - 1];
                const pprevX = (prev.x / 100) * 2800;
                const cx = (pprevX + px) / 2;
                return `${acc} Q ${cx} ${prev.y}%, ${px} ${curr.y}%`;
              }, "")}
              fill="none"
              stroke="#132414"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* Inner Golden Cobblestone Road Surface */}
            <path
              d={activeWorld.lessons.reduce((acc, curr, idx) => {
                const px = (curr.x / 100) * 2800;
                if (idx === 0) return `M ${px} ${curr.y}%`;
                const prev = activeWorld.lessons[idx - 1];
                const pprevX = (prev.x / 100) * 2800;
                const cx = (pprevX + px) / 2;
                return `${acc} Q ${cx} ${prev.y}%, ${px} ${curr.y}%`;
              }, "")}
              fill="none"
              stroke="#e6ca9c"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* White Dashed Center Line */}
            <path
              d={activeWorld.lessons.reduce((acc, curr, idx) => {
                const px = (curr.x / 100) * 2800;
                if (idx === 0) return `M ${px} ${curr.y}%`;
                const prev = activeWorld.lessons[idx - 1];
                const pprevX = (prev.x / 100) * 2800;
                const cx = (pprevX + px) / 2;
                return `${acc} Q ${cx} ${prev.y}%, ${px} ${curr.y}%`;
              }, "")}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="10 10"
            />
          </svg>

          {/* 7 STATIONS PER WORLD (6 LESSONS + 1 FINAL BOSS EXAM) */}
          {activeWorld.lessons.map((node, idx) => {
            const isDone = node.percentComplete >= 100;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeModal(node)}
                className={`absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                  !node.isUnlocked ? "opacity-90 grayscale-[25%]" : ""
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                {/* BADGE: FINAL BOSS EXAM vs REGULAR LESSON */}
                <div className="mb-2 flex items-center gap-1">
                  {node.isExam ? (
                    <Mono className="rounded-md border-2 border-st-fg bg-gradient-to-r from-st-accent to-st-accent/70 px-3 py-1 text-[11px] font-black text-st-fg shadow-xl uppercase animate-pulse flex items-center gap-1">
                      <Trophy size={13} className="text-st-fg fill-st-fg" />
                      <span>W{activeWorld.id} FINAL BOSS EXAM</span>
                    </Mono>
                  ) : (
                    <Mono
                      className={`rounded-md border-2 border-st-fg px-2.5 py-0.5 text-[10px] font-black shadow-md uppercase ${
                        node.isUnlocked ? "bg-st-accent text-st-fg" : "bg-st-muted text-st-muted-fg"
                      }`}
                    >
                      LESSON {node.globalLessonNumber}
                    </Mono>
                  )}
                  {idx < activeWorld.lessons.length - 1 && node.isUnlocked && (
                    <ArrowRight size={14} className="text-st-accent animate-pulse" />
                  )}
                </div>

                {/* VISUAL NODE ASSET: BOSS EXAM vs REGULAR LESSON */}
                {node.isExam ? (
                  /* FINAL BOSS EXAM STATION UI */
                  <div className="relative flex size-20 items-center justify-center rounded-3xl border-4 border-st-fg bg-gradient-to-b from-st-accent to-st-accent/70 shadow-[0_0_30px_rgba(245,158,11,0.95)] animate-bounce">
                    <Crown className="size-11 text-st-fg fill-st-accent" />
                    <Sparkles className="absolute -top-2 -left-2 size-6 text-st-accent fill-st-accent" />
                    {!node.isUnlocked && (
                      <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 border-st-fg bg-st-destructive text-st-primary-fg shadow-md">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>
                ) : (
                  /* REGULAR LESSON NODE UI */
                  <div
                    className={`relative flex size-16 items-center justify-center rounded-2xl border-4 border-st-fg shadow-2xl transition-transform hover:rotate-3 ${
                      node.isUnlocked ? "bg-st-card" : "bg-st-muted/90"
                    }`}
                  >
                    {node.number === 2 && activeWorld.id === 1 ? (
                      <StudentAvatar
                        seed={seed}
                        overrides={overrides}
                        size={40}
                        shape="square"
                      />
                    ) : (
                      <img
                        src="/kenney/tiny-town/Tiles/tile_0094.png"
                        alt=""
                        className={`h-10 w-10 object-contain ${!node.isUnlocked ? "opacity-40" : ""}`}
                        style={{ imageRendering: "pixelated" }}
                      />
                    )}

                    {isDone ? (
                      <CheckCircle className="absolute -top-2 -right-2 size-7 text-st-secondary fill-st-secondary bg-white rounded-full border border-st-fg" />
                    ) : !node.isUnlocked ? (
                      <div className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 border-st-fg bg-st-destructive text-st-primary-fg shadow-md">
                        <Lock size={14} />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* LESSON / BOSS EXAM TITLE CARD */}
                <div
                  className={`mt-2 text-center px-3 py-1.5 rounded-xl border shadow-xl max-w-[210px] ${
                    node.isExam
                      ? "bg-gradient-to-r from-st-accent to-st-primary border-st-fg text-st-primary-fg"
                      : "bg-black/85 border-white/20 text-white"
                  }`}
                >
                  <span className="st-display text-xs font-black block truncate">
                    {node.name}
                  </span>
                  <Mono
                    className={`text-[9px] font-extrabold block ${
                      node.isExam
                        ? "text-st-accent"
                        : node.isUnlocked
                          ? "text-st-accent"
                          : "text-st-destructive"
                    }`}
                  >
                    {node.isExam ? (
                      <span className="inline-flex items-center gap-1">
                        World 1 Final Boss Exam <Trophy className="h-2.5 w-2.5" />
                      </span>
                    ) : node.isUnlocked ? (
                      `${node.percentComplete}% Completed`
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        LOCKED <Lock className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </Mono>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXP LEARNING DATA MODAL */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative border-4 border-st-fg p-6 rounded-3xl w-full max-w-md bg-st-card text-st-fg space-y-4 shadow-2xl">
            <button
              onClick={() => setShowExpModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full border-2 border-st-fg bg-st-bg text-st-fg hover:bg-st-peach"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <Zap size={24} className="text-st-primary" />
              <div>
                <h3 className="st-display text-xl font-black">Level & EXP Learning Data</h3>
                <Mono className="text-xs text-st-muted-fg font-bold">CEFR {cefrBand} Multi-World Progress</Mono>
              </div>
            </div>

            <div className="bg-st-peach p-3.5 rounded-2xl border-2 border-st-fg space-y-2">
              <div className="flex justify-between text-xs font-black">
                <span>Level {levelNumber}</span>
                <Mono className="text-st-primary font-bold">420 / 600 EXP</Mono>
              </div>
              <div className="w-full h-3 rounded-full bg-st-bg border border-st-fg overflow-hidden">
                <div className="h-full bg-st-primary w-[70%]" />
              </div>
              <Mono className="text-[10px] text-st-muted-fg font-bold block text-center">
                +180 EXP needed to level up to Level {levelNumber + 1}!
              </Mono>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Mastered Words</Mono>
                <span className="st-display text-xl font-black text-st-fg">8 Words</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Grammar Rules</Mono>
                <span className="st-display text-xl font-black text-st-fg">12 Rules</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Daily Streak</Mono>
                <span className="st-display text-xl font-black text-st-fg">{streak} Days</span>
              </div>
              <div className="rounded-xl border-2 border-st-fg bg-st-card p-3">
                <Mono className="text-st-muted-fg text-[10px] font-bold block uppercase">Star Reward Points</Mono>
                <span className="st-display text-xl font-black text-st-fg">64 Stars</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NODE MODAL */}
      {selectedNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`relative border-4 border-st-fg p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-4 text-center ${
              selectedNodeModal.isExam
                ? "bg-gradient-to-b from-st-accent/30 via-st-peach to-st-card text-st-fg border-st-accent"
                : "bg-st-card text-st-fg"
            }`}
          >
            <button
              onClick={() => setSelectedNodeModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full border-2 border-st-fg bg-st-bg hover:bg-st-peach text-st-fg"
            >
              <X size={16} />
            </button>

            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-st-fg p-2 shadow-inner relative overflow-hidden ${
                selectedNodeModal.isExam ? "bg-st-accent/20 border-st-accent" : "bg-st-peach"
              }`}
            >
              {selectedNodeModal.isExam ? (
                <Trophy className="size-16 text-st-accent animate-pulse" />
              ) : (
                <StudentAvatar seed={seed} overrides={overrides} size={56} shape="square" />
              )}
            </div>

            <div>
              <h3
                className={`st-display text-xl font-black ${
                  selectedNodeModal.isExam ? "text-st-accent" : "text-st-fg"
                }`}
              >
                {selectedNodeModal.name}
              </h3>
              <p className="text-xs text-st-muted-fg mt-1.5 font-medium leading-relaxed">
                {selectedNodeModal.subtitle}
              </p>
            </div>

            {selectedNodeModal.isExam && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-st-accent/60 rounded-xl border border-st-accent/40 text-[11px] font-extrabold text-st-fg">
                <div className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> 20 Minutes</div>
                <div className="flex items-center gap-1"><PenLine className="h-3.5 w-3.5" /> 10 Questions</div>
                <div className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> +100 Stars XP</div>
                <div className="flex items-center gap-1"><Medal className="h-3.5 w-3.5" /> CEFR Certificate</div>
              </div>
            )}

            <div className="pt-2">
              {selectedNodeModal.isUnlocked ? (
                <Link
                  href={
                    selectedNodeModal.isExam
                      ? `/student/${studentId}/challenges?tab=exam`
                      : `/student/${studentId}/practice/${selectedNodeModal.topicId}`
                  }
                >
                  <button
                    type="button"
                    className={`w-full py-3 px-4 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-st-fg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                      selectedNodeModal.isExam
                        ? "bg-st-accent text-st-fg border-st-fg"
                        : "bg-st-primary text-st-primary-fg"
                    }`}
                  >
                    {selectedNodeModal.isExam ? (
                      <>
                        <Trophy size={16} /> Challenge World Final Boss Exam
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Launch Practice Exercises
                      </>
                    )}
                  </button>
                </Link>
              ) : (
                <div className="p-3 bg-st-destructive/80 border-2 border-st-destructive rounded-xl">
                  <Mono className="text-xs font-black text-st-primary-fg flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Station Locked
                  </Mono>
                  <p className="text-[11px] text-st-primary-fg font-medium mt-0.5">
                    Complete previous lessons to unlock this {selectedNodeModal.isExam ? "final boss exam" : "unit"}!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
