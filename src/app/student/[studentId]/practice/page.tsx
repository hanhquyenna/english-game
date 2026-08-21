import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getMistakeBank, getSkillStarsData } from "@/lib/actions/game-loop-actions";
import { PracticeHomeClient } from "@/components/student/practice-home-client";

export const dynamic = "force-dynamic";

export default async function ActivePracticeHomePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  if (!isFeatureEnabled("ACTIVE_PRACTICE")) {
    notFound();
  }

  const { studentId } = await params;
  const mistakes = await getMistakeBank(studentId);
  const attempts = await getSkillStarsData(studentId);

  return (
    <PracticeHomeClient
      studentId={studentId}
      mistakes={mistakes as any[]}
      attempts={attempts}
    />
  );
}
