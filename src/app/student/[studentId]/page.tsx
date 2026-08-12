import { notFound } from "next/navigation";
import {
  getClassForStudent,
  getIslandTopics,
  getStudentSummary,
} from "@/lib/queries";
import { buildIslands, currentPosition } from "@/lib/islands";
import { IslandBand } from "@/components/student/island-band";
import { Mono, ProgressTrack, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * Learn / path screen, ported from the prototype's PathScreen: a primary-filled
 * level card (`styles.levelCard`) followed by one tile per island.
 */
export default async function LearnPage({
  params,
}: PageProps<"/student/[studentId]">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student) notFound();

  const topics = klass ? await getIslandTopics(klass.id, studentId) : [];
  const islands = buildIslands(topics);
  const here = currentPosition(islands);
  const level = student.level;

  return (
    <div className="pb-6">
      <Tile
        className="mx-4 mt-4 p-4"
        style={{ backgroundColor: "var(--st-primary)" }}
      >
        <div className="flex items-center justify-between">
          <span className="st-display text-[24px] text-st-primary-fg">
            {level?.cefrBand ?? "—"}
          </span>
          <Mono className="font-bold text-st-primary-fg">
            {level
              ? level.nextBand
                ? `${level.progressToNextBand}% to ${level.nextBand}`
                : "Top band reached"
              : "No level yet"}
          </Mono>
        </div>
        <ProgressTrack
          className="mt-2.5"
          percent={level?.progressToNextBand ?? 0}
          trackColor="rgba(244,236,221,0.3)"
          fillColor="var(--st-accent)"
        />
        <Mono className="mt-2.5 block text-st-primary-fg">
          Your learning path · keep moving forward
        </Mono>
      </Tile>

      {islands.length === 0 ? (
        <Tile
          className="mx-4 mt-5 p-6 text-center"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <p className="st-display text-[17px] text-st-fg">No lessons yet</p>
          <Mono className="mt-2 block text-st-muted-fg">
            When your teacher assigns a unit, it appears here straight away.
          </Mono>
        </Tile>
      ) : (
        islands.map((island, i) => (
          <IslandBand
            key={island.topicId}
            studentId={studentId}
            island={island}
            index={i}
            here={here}
            seed={student.avatarSeed}
            overrides={student.overrides}
          />
        ))
      )}
    </div>
  );
}
