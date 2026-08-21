import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { BeeblastWorldCanvas } from "@/components/student/beeblast-world-canvas";

export const dynamic = "force-dynamic";

/**
 * Beeblast Student Home — Complex Mini-Forest Main Menu RPG World Hub
 */
export default async function LearnPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  const level = student.level;
  const levelNumber =
    level?.cefrBand === "A1"
      ? 1
      : level?.cefrBand === "A2"
        ? 2
        : level?.cefrBand === "B1"
          ? 3
          : level?.cefrBand === "B2"
            ? 4
            : level?.cefrBand === "C1"
              ? 5
              : 6;

  return (
    <BeeblastWorldCanvas
      studentId={studentId}
      seed={student.avatarSeed}
      overrides={student.overrides}
      gems={student.gems}
      streak={student.streak}
      levelNumber={levelNumber}
      cefrBand={level?.cefrBand ?? "B2"}
    />
  );
}
