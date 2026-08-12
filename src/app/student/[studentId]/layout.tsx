import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { StudentShell } from "@/components/student/student-shell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
  params,
}: LayoutProps<"/student/[studentId]">) {
  const { studentId } = await params;
  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  return (
    <StudentShell
      studentId={studentId}
      seed={student.avatarSeed}
      overrides={student.overrides}
      items={student.items}
      streak={student.streak}
      gems={student.gems}
    >
      {children}
    </StudentShell>
  );
}
