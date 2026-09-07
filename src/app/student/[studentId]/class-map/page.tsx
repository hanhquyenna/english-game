import { notFound } from "next/navigation";
import { getVillageMapData, getStudentSummary } from "@/lib/queries";
import { VillageMapClient } from "@/components/student/village-map-client";

export const dynamic = "force-dynamic";

export default async function ClassMapPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const [student, villageData] = await Promise.all([
    getStudentSummary(studentId),
    getVillageMapData(studentId),
  ]);

  if (!student || !villageData) notFound();

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

  const levelName =
    levelNumber === 1
      ? "Tập sự ngôn ngữ"
      : levelNumber === 2
        ? "Nhà thám hiểm"
        : levelNumber === 3
          ? "Chiến binh từ vựng"
          : levelNumber === 4
            ? "Thợ săn từ"
            : levelNumber === 5
              ? "Bậc thầy giao tiếp"
              : "Huyền thoại Beeblast";

  return (
    <VillageMapClient
      studentId={studentId}
      data={villageData}
      studentSummary={{
        name: student.name,
        gems: student.gems,
        streak: student.streak,
        totalXp: student.totalXp,
        avatarSeed: student.avatarSeed,
        overrides: student.overrides,
        items: student.items,
        levelNumber,
        levelName,
      }}
    />
  );
}
