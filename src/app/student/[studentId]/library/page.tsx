import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Gem } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { BlockButton, Mono, PageTitle, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

export default async function StoryLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ difficulty?: string }>;
}) {
  if (!isFeatureEnabled("STORY_LIBRARY")) {
    notFound();
  }

  const { studentId } = await params;
  const { difficulty } = await searchParams;
  const db = createServerSupabase();

  let query = (db as any)
    .from("stories")
    .select("id, title, cover_url, genre, difficulty, cefr_band, topic_tag")
    .order("created_at");

  if (difficulty && difficulty !== "all") {
    query = query.eq("difficulty", difficulty);
  }

  const { data: storiesData } = await query;

  const stories = (storiesData as any[]) ?? [
    {
      id: "30000000-0000-0000-0000-000000000001",
      title: "Rubee and the Magical Honeybee",
      cover_url: "",
      genre: "fantasy",
      difficulty: "easy",
      cefr_band: "A1",
      topic_tag: "animals",
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      title: "The Secret School Garden",
      cover_url: "",
      genre: "adventure",
      difficulty: "easy",
      cefr_band: "A1",
      topic_tag: "nature",
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      title: "Space Journey of Little Bee",
      cover_url: "",
      genre: "sci-fi",
      difficulty: "hard",
      cefr_band: "A2",
      topic_tag: "space",
    },
  ];

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/student/${studentId}`}
          className="flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-card transition-opacity active:opacity-70"
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} className="text-st-fg" />
        </Link>
        <PageTitle className="flex-1">Story Library</PageTitle>
      </div>

      <p className="mb-4 text-[13px] text-st-muted-fg leading-relaxed font-medium">
        Read interactive stories with audio sync! Earn +1 Gem for every first-time page read.
      </p>

      {/* Difficulty Filter Chips */}
      <div className="mb-5 flex gap-2">
        <Link
          href={`/student/${studentId}/library`}
          className={`st-mono flex-1 rounded-[2px] border-2 border-st-fg py-2 text-center text-[11px] font-extrabold uppercase transition-opacity active:opacity-70 ${
            !difficulty || difficulty === "all"
              ? "bg-st-primary text-st-primary-fg"
              : "bg-st-card text-st-fg"
          }`}
        >
          All Stories
        </Link>
        <Link
          href={`/student/${studentId}/library?difficulty=easy`}
          className={`st-mono flex-1 rounded-[2px] border-2 border-st-fg py-2 text-center text-[11px] font-extrabold uppercase transition-opacity active:opacity-70 ${
            difficulty === "easy"
              ? "bg-st-primary text-st-primary-fg"
              : "bg-st-card text-st-fg"
          }`}
        >
          Easy (A1)
        </Link>
        <Link
          href={`/student/${studentId}/library?difficulty=hard`}
          className={`st-mono flex-1 rounded-[2px] border-2 border-st-fg py-2 text-center text-[11px] font-extrabold uppercase transition-opacity active:opacity-70 ${
            difficulty === "hard"
              ? "bg-st-primary text-st-primary-fg"
              : "bg-st-card text-st-fg"
          }`}
        >
          Challenge (A2+)
        </Link>
      </div>

      {/* Stories Shelf Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stories.map((story) => (
          <Tile
            key={story.id}
            className="flex flex-col justify-between bg-st-card p-4 transition-transform active:scale-[0.99]"
          >
            <div>
              <div className="mb-3 flex h-24 items-center justify-center rounded-[2px] border-2 border-st-fg bg-st-peach text-5xl">
                {story.cover_url || ""}
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Mono className="rounded-[2px] bg-st-primary px-1.5 py-0.5 text-st-primary-fg font-bold uppercase">
                  {story.difficulty === "easy" ? "Easy" : "Hard"}
                </Mono>
                <Mono className="text-st-muted-fg font-extrabold">
                  • {story.cefr_band}
                </Mono>
              </div>
              <h2 className="st-display text-[17px] text-st-fg leading-tight mb-1 font-black">
                {story.title}
              </h2>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-st-fg flex items-center justify-between">
              <span className="flex items-center gap-1 text-[12px] font-bold text-st-primary">
                <Gem size={14} /> +1 Gem/page
              </span>
              <Link href={`/student/${studentId}/library/${story.id}`}>
                <BlockButton tone="primary" className="min-h-[38px] px-3 text-[11px]">
                  <BookOpen size={14} /> Read Now
                </BlockButton>
              </Link>
            </div>
          </Tile>
        ))}
      </div>
    </div>
  );
}
