import { notFound } from "next/navigation";
import {
  getClassForStudent,
  getIslandTopics,
  getStudentSummary,
} from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { buildIslands, currentPosition } from "@/lib/islands";
import { IslandBand } from "@/components/student/island-band";
import { StreakNotice } from "@/components/student/streak-notice";
import { isoDate } from "@/lib/progression";

export const dynamic = "force-dynamic";

/** Scenery palette per island position, from the design prototype. */
const ISLAND_THEMES = [
  { bandBg: "#e9f2e4", iconBg: "#5a9f4f", ground: "#cfe6c4" },
  { bandBg: "#e6eef6", iconBg: "#3d6fe0", ground: "#cddcee" },
  { bandBg: "#efe9f6", iconBg: "#8f7fd6", ground: "#ded4ef" },
];

export default async function LearnPage({
  params,
}: PageProps<"/student/[studentId]">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student) notFound();

  const topics = klass ? await getIslandTopics(klass.id, studentId) : [];
  const islands = buildIslands(topics);
  const here = currentPosition(islands);

  // The streak banner is a real warning, not decoration: it only shows when
  // today genuinely has no practice logged yet and a streak is on the line.
  const db = createServerSupabase();
  const { data: today } = await db
    .from("xp_events")
    .select("xp")
    .eq("student_id", studentId)
    .eq("date", isoDate())
    .maybeSingle();

  const practisedToday = Number(today?.xp ?? 0) > 0;
  const streakAtRisk = !practisedToday && student.streak > 0;

  return (
    <div>
      {streakAtRisk ? <StreakNotice streak={student.streak} /> : null}

      {islands.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🌱
          </p>
          <p className="mt-3 font-display text-lg font-extrabold text-[#2a2540]">
            No lessons yet
          </p>
          <p className="mt-1 text-sm text-[#8b83c4]">
            When your teacher assigns a unit, it appears here straight away.
          </p>
        </div>
      ) : (
        islands.map((island, i) => (
          <IslandBand
            key={island.topicId}
            studentId={studentId}
            island={island}
            theme={ISLAND_THEMES[i % ISLAND_THEMES.length]}
            index={i}
            here={here}
            seed={student.avatarSeed}
            overrides={student.overrides}
          />
        ))
      )}

      <div className="h-5" />
    </div>
  );
}
