import { notFound } from "next/navigation";
import { GraduationCap, BookOpen, ClipboardCheck, Megaphone } from "lucide-react";
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
      groups={[
        {
          title: "Tổng quan",
          items: [{ href: base, label: "Tổng quan", icon: "dashboard" }],
        },
        {
          title: "Học liệu",
          items: [{ href: `${base}/materials`, label: "Thư viện học liệu", icon: "materials" }],
        },
        {
          title: "Giảng dạy",
          items: [
            { href: `${base}/roster`, label: "Lớp học", icon: "school" },
            { href: `${base}/curriculum`, label: "Chương trình", icon: "curriculum" },
            { href: `${base}/lesson-plans`, label: "Giáo án", icon: "lesson_plans" },
          ],
        },
        {
          title: "Đánh giá",
          items: [
            { href: `${base}/exams/builder`, label: "Soạn đề", icon: "builder" },
            { href: `${base}/gradebook`, label: "Chấm bài", icon: "gradebook" },
            { href: `${base}/assignments/history`, label: "Lịch sử giao bài", icon: "history" },
          ],
        },
        {
          title: "Hoạt động",
          items: [
            { href: `${base}/portfolio`, label: "Portfolio Học sinh", icon: "materials" },
            { href: `${base}/story`, label: "Bảng tin", icon: "story" },
          ],
        },
        {
          title: "Hệ thống",
          items: [
            { href: `${base}/account`, label: "Tài khoản", icon: "account" },
            { href: `${base}/help`, label: "Trợ giúp", icon: "help" },
          ],
        },
      ]}
    >
      {children}
    </PersonaShell>
  );
}
