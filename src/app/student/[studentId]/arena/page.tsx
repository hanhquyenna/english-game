import { notFound } from "next/navigation";
import {
  getClassForStudent,
  getRoster,
  getStudentSummary,
  type StudentSummary,
} from "@/lib/queries";
import { buildIslands } from "@/lib/islands";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArenaClient } from "@/components/student/arena-client";

export const dynamic = "force-dynamic";

export default async function ArenaPage({
  params,
}: PageProps<"/student/[studentId]/arena">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student) notFound();

  const db = createServerSupabase();
  const cefrBand = student.level?.cefrBand ?? "B1";

  // Fetch library topics for CEFR band (or all unassigned library topics)
  const { data: libraryTopicsRaw } = await db
    .from("topics")
    .select("*")
    .or(`class_id.is.null,source.eq.library`)
    .order("order");

  const topics = (libraryTopicsRaw ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle ?? null,
    assigned_at: new Date().toISOString(), // Unlocks practice path
    percentComplete: 0,
    hasExam: false,
  }));

  // Fallback demo topics if none in DB yet
  if (topics.length === 0) {
    topics.push(
      {
        id: "arena-lib-1",
        title: "Travel & Airport Conversations",
        subtitle: "A1–B1 Spoken English Practice",
        assigned_at: new Date().toISOString(),
        percentComplete: 0,
        hasExam: false,
      },
      {
        id: "arena-lib-2",
        title: "Workplace & Email Etiquette",
        subtitle: "B1–B2 Business English",
        assigned_at: new Date().toISOString(),
        percentComplete: 0,
        hasExam: false,
      },
    );
  }

  const islands = buildIslands(topics);
  const leaderboardRaw = klass ? await getRoster(klass.id) : [];

  const leaderboard = leaderboardRaw.map((entry: StudentSummary) => ({
    id: entry.id,
    name: entry.name,
    xp: entry.totalXp,
    cefrBand: entry.level?.cefrBand ?? "B1",
    avatarSeed: entry.avatarSeed,
    overrides: entry.overrides,
    items: entry.items,
  }));

  // League gating: check if student has completed practice work
  const leagueUnlocked = student.streak > 0 || student.totalXp >= 100;

  return (
    <ArenaClient
      studentId={studentId}
      studentSeed={student.avatarSeed}
      studentOverrides={student.overrides}
      studentItems={student.items}
      cefrBand={cefrBand}
      islands={islands}
      streak={student.streak}
      levelNumber={Math.floor((student.totalXp ?? 0) / 100) + 1}
      leagueUnlocked={leagueUnlocked}
      leagueTier="CHAMPION"
      leaderboard={leaderboard}
    />
  );
}
