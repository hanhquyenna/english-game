import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { BlockButton, Mono, PageTitle, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

export default async function RolePlayTopicSelectPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  if (!isFeatureEnabled("ROLE_PLAY")) {
    notFound();
  }

  const { studentId } = await params;
  const db = createServerSupabase();

  const { data: topics } = await (db as any)
    .from("role_play_topics")
    .select("id, title_vi, icon, cefr_band")
    .eq("is_active", true)
    .order("created_at");

  const topicList = (topics as any[]) ?? [
    { id: "10000000-0000-0000-0000-000000000001", title_vi: "House Tour", icon: "🏠", cefr_band: "A1" },
    { id: "10000000-0000-0000-0000-000000000002", title_vi: "My Classroom", icon: "🏫", cefr_band: "A1" },
    { id: "10000000-0000-0000-0000-000000000003", title_vi: "My Lunch", icon: "🍱", cefr_band: "A1" },
  ];

  const randomTopic = topicList[Math.floor(Math.random() * topicList.length)];

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
        <PageTitle className="flex-1">AI Role Play</PageTitle>
      </div>

      <p className="mb-5 text-[14px] leading-relaxed text-st-muted-fg font-medium">
        Practice speaking English with fun topics alongside your companion guide! Complete
        3 tasks in each session to earn +30 Gems and +50 XP.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topicList.map((t) => (
          <Tile
            key={t.id}
            className="flex flex-col justify-between bg-st-card p-4 transition-transform active:scale-[0.99]"
          >
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-3xl">{t.icon}</span>
                <Mono className="rounded-[2px] bg-st-peach px-2 py-0.5 font-bold text-st-primary">
                  {t.cefr_band}
                </Mono>
              </div>
              <h2 className="st-display mb-1 text-[18px] text-st-fg">
                {t.title_vi}
              </h2>
              <Mono className="text-st-muted-fg">3 Nhiệm vụ nói</Mono>
            </div>

            <Link
              href={`/student/${studentId}/roleplay/${t.id}`}
              className="mt-4 block"
            >
              <BlockButton tone="primary" className="w-full min-h-[44px]">
                <Mic size={15} /> Bắt đầu luyện
              </BlockButton>
            </Link>
          </Tile>
        ))}

        {/* Random Topic Tile */}
        {randomTopic && (
          <Tile className="flex flex-col justify-between border-dashed bg-st-peach p-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-3xl">🎲</span>
                <Mono className="rounded-[2px] bg-st-accent px-2 py-0.5 font-bold text-st-fg">
                  Ngẫu nhiên
                </Mono>
              </div>
              <h2 className="st-display mb-1 text-[18px] text-st-fg">
                Chủ đề Ngẫu nhiên
              </h2>
              <Mono className="text-st-muted-fg">Thử thách bất ngờ</Mono>
            </div>

            <Link
              href={`/student/${studentId}/roleplay/${randomTopic.id}`}
              className="mt-4 block"
            >
              <BlockButton tone="accent" className="w-full min-h-[44px]">
                <Sparkles size={15} /> Chơi ngẫu nhiên
              </BlockButton>
            </Link>
          </Tile>
        )}
      </div>
    </div>
  );
}
