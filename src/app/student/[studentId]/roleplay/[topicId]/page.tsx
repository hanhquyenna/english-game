import { notFound } from "next/navigation";
import { School } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { RolePlayClient } from "@/components/student/roleplay-client";

export const dynamic = "force-dynamic";

export default async function RolePlayTopicRoomPage({
  params,
}: {
  params: Promise<{ studentId: string; topicId: string }>;
}) {
  if (!isFeatureEnabled("ROLE_PLAY")) {
    notFound();
  }

  const { studentId, topicId } = await params;
  const db = createServerSupabase();

  const { data: topic } = await (db as any)
    .from("role_play_topics")
    .select("id, title_vi, icon, cefr_band")
    .eq("id", topicId)
    .maybeSingle();

  const { data: tasks } = await (db as any)
    .from("role_play_tasks")
    .select("id, order, prompt_vi, keyword_hints")
    .eq("topic_id", topicId)
    .order("order");

  const topicData = topic ?? {
    id: topicId,
    title_vi: "Role Play Room",
    icon: <School className="h-6 w-6 text-st-primary" />,
    cefr_band: "A1",
  };

  const tasksData = (tasks as any[]) ?? [
    {
      id: "t1",
      order: 1,
      prompt_vi: "Nói 1 đồ vật có trong bài",
      keyword_hints: ["desk", "chair", "table", "room", "book"],
    },
    {
      id: "t2",
      order: 2,
      prompt_vi: "Nói em dùng nó để làm gì",
      keyword_hints: ["write", "read", "study", "use", "play"],
    },
    {
      id: "t3",
      order: 3,
      prompt_vi: "Nói vị trí của nó",
      keyword_hints: ["on", "in", "under", "near", "here"],
    },
  ];

  return (
    <RolePlayClient
      studentId={studentId}
      topic={topicData as any}
      tasks={tasksData as any[]}
    />
  );
}
