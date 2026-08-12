import Link from "next/link";
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
    <div className="px-4 py-4">
      <Link
        href={`/student/${studentId}/profile`}
        className="text-[13px] font-bold text-[#8b83c4]"
      >
        ← Profile
      </Link>
      <AvatarPicker
        studentId={studentId}
        currentSeed={student.avatarSeed}
        currentOverrides={student.overrides}
      />
    </div>
  );
}
