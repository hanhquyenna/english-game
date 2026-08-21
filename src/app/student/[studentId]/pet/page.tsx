import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { BuddyPetClient } from "@/components/student/buddy-pet-client";

export const dynamic = "force-dynamic";

export default async function BuddyPetPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  if (!isFeatureEnabled("BUDDY_PET")) {
    notFound();
  }

  const { studentId } = await params;
  return <BuddyPetClient studentId={studentId} />;
}
