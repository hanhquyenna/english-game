import { notFound } from "next/navigation";
import { getClassForTeacher, getUser } from "@/lib/queries";
import { PersonaShell } from "@/components/persona-shell";
import { LiveBadge } from "@/components/live-badge";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
  params,
}: LayoutProps<"/teacher/[teacherId]">) {
  const { teacherId } = await params;
  const [teacher, klass] = await Promise.all([
    getUser(teacherId),
    getClassForTeacher(teacherId),
  ]);

  if (!teacher || teacher.role !== "TEACHER") notFound();

  const base = `/teacher/${teacherId}`;

  return (
    <PersonaShell
      persona="teacher"
      title={teacher.name}
      subtitle={klass?.name ?? "Chưa có lớp"}
      headerRight={<LiveBadge tables={["level_scores", "exercise_attempts"]} />}
      nav={[
        { href: base, label: "Lớp học", icon: "👩‍🏫" },
        { href: `${base}/curriculum`, label: "Chương trình", icon: "📚" },
        { href: `${base}/gradebook`, label: "Chấm bài", icon: "✅" },
        { href: `${base}/story`, label: "Bảng tin", icon: "📣" },
      ]}
    >
      {children}
    </PersonaShell>
  );
}
