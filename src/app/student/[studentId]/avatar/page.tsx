import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { AvatarPicker } from "@/components/student/avatar-picker";

export const dynamic = "force-dynamic";

export default async function AvatarPickerPage({
  params,
}: PageProps<"/student/[studentId]/avatar">) {
  const { studentId } = await params;
  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  return (
    <AvatarPicker
      studentId={studentId}
      currentSeed={student.avatarSeed}
      currentOverrides={student.overrides}
    />
  );
}
