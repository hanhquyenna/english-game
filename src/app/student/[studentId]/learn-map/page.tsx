import { notFound } from "next/navigation";
import { getClassForStudent, getIslandTopics, getStudentSummary } from "@/lib/queries";
import { buildIslands } from "@/lib/islands";
import { LearnMapClient } from "@/components/student/learn-map-client";

export const dynamic = "force-dynamic";

/**
 * Interactive Tiny Town Lesson Map Page
 */
export default async function LearnMapPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student) notFound();

  const topics = klass ? await getIslandTopics(klass.id, studentId) : [];
  const islands = buildIslands(topics);

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
    <LearnMapClient
      studentId={studentId}
      seed={student.avatarSeed}
      overrides={student.overrides}
      gems={student.gems}
      streak={student.streak}
      levelNumber={levelNumber}
      cefrBand={level?.cefrBand ?? "B2"}
      islands={islands}
    />
  );
}
