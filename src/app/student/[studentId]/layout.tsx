import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { PersonaShell } from "@/components/persona-shell";
import { LiveBadge } from "@/components/live-badge";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
  params,
}: LayoutProps<"/student/[studentId]">) {
  const { studentId } = await params;
  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  const base = `/student/${studentId}`;

  return (
    <PersonaShell
      persona="student"
      title={`Chào ${student.name}!`}
      subtitle={`🔥 ${student.streak} ngày · ${student.totalXp} XP${
        student.level ? ` · ${student.level.cefrBand}` : ""
      }`}
      headerRight={
        <LiveBadge tables={["topics", "level_scores", "notifications"]} />
      }
      nav={[
        { href: base, label: "Học", icon: "🗺️" },
        { href: `${base}/leaderboard`, label: "Bảng xếp hạng", icon: "🏆" },
        { href: `${base}/profile`, label: "Hồ sơ", icon: "🧑‍🚀" },
      ]}
    >
      {children}
    </PersonaShell>
  );
}
