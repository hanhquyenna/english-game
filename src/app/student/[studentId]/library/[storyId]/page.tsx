import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { StoryReaderClient } from "@/components/student/story-reader-client";

export const dynamic = "force-dynamic";

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; storyId: string }>;
}) {
  if (!isFeatureEnabled("STORY_LIBRARY")) {
    notFound();
  }

  const { studentId, storyId } = await params;
  const db = createServerSupabase();

  const { data: story } = await (db as any)
    .from("stories")
    .select("id, title, cover_url")
    .eq("id", storyId)
    .maybeSingle();

  const { data: pages } = await (db as any)
    .from("story_pages")
    .select("id, order, illustration_url, text_en, audio_url, word_timings")
    .eq("story_id", storyId)
    .order("order");

  const storyData = story ?? {
    id: storyId,
    title: "Rubee and the Magical Honeybee",
    cover_url: "",
  };

  const pagesData = (pages as any[]) ?? [
    {
      id: "p1",
      order: 1,
      illustration_url: "",
      text_en: "Rubee woke up early today to find the golden flower.",
      word_timings: [
        { word: "Rubee", start_ms: 0, end_ms: 400 },
        { word: "woke", start_ms: 400, end_ms: 800 },
        { word: "up", start_ms: 800, end_ms: 1100 },
        { word: "early", start_ms: 1100, end_ms: 1500 },
        { word: "today", start_ms: 1500, end_ms: 1900 },
        { word: "to", start_ms: 1900, end_ms: 2100 },
        { word: "find", start_ms: 2100, end_ms: 2500 },
        { word: "the", start_ms: 2500, end_ms: 2700 },
        { word: "golden", start_ms: 2700, end_ms: 3200 },
        { word: "flower.", start_ms: 3200, end_ms: 3800 },
      ],
    },
    {
      id: "p2",
      order: 2,
      illustration_url: "",
      text_en: "The little bee flew across the green meadow happily.",
      word_timings: [
        { word: "The", start_ms: 0, end_ms: 200 },
        { word: "little", start_ms: 200, end_ms: 600 },
        { word: "bee", start_ms: 600, end_ms: 1000 },
        { word: "flew", start_ms: 1000, end_ms: 1400 },
        { word: "across", start_ms: 1400, end_ms: 1900 },
        { word: "the", start_ms: 1900, end_ms: 2100 },
        { word: "green", start_ms: 2100, end_ms: 2600 },
        { word: "meadow", start_ms: 2600, end_ms: 3100 },
        { word: "happily.", start_ms: 3100, end_ms: 3700 },
      ],
    },
  ];

  return (
    <StoryReaderClient
      studentId={studentId}
      story={storyData as any}
      pages={pagesData as any[]}
    />
  );
}
