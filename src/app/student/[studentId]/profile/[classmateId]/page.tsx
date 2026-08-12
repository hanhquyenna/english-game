import { notFound } from "next/navigation";
import { getProfileData } from "@/lib/profile-data";
import { ProfileView } from "@/components/student/profile-view";

export const dynamic = "force-dynamic";

/** A classmate's profile — same renderer, read-only. */
export default async function ClassmateProfilePage({
  params,
}: PageProps<"/student/[studentId]/profile/[classmateId]">) {
  const { studentId, classmateId } = await params;
  const data = await getProfileData(studentId, classmateId);
  if (!data) notFound();

  return (
    <ProfileView
      viewerId={studentId}
      student={data.student}
      rank={data.rank}
      className={data.className}
      vocabMastered={data.vocabMastered}
      comments={data.comments}
      isMe={studentId === classmateId}
    />
  );
}
