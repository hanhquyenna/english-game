import Link from "next/link";
import { getClassForTeacher, getRoster } from "@/lib/queries";
import { INPUT_LABELS, weakestInput } from "@/lib/level-engine";
import { StudentAvatar } from "@/components/student-avatar";
import { LevelBar } from "@/components/level-bar";
import { KudosButton } from "@/components/teacher/kudos-button";
import { StreakCheckButton } from "@/components/teacher/streak-check-button";
import { StreakPill } from "@/components/streak-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard({
  params,
}: PageProps<"/teacher/[teacherId]">) {
  const { teacherId } = await params;
  const klass = await getClassForTeacher(teacherId);
  if (!klass) {
    return <p className="text-muted-foreground">Chưa có lớp nào.</p>;
  }

  const roster = await getRoster(klass.id);
  const scored = roster.filter((s) => s.level);

  const classAverage =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, s) => sum + s.level!.compositeScore, 0) /
            scored.length) *
            10,
        ) / 10;

  const needsAttention = roster.filter(
    (s) => s.streakState !== "ACTIVE_TODAY" || (s.level?.compositeScore ?? 0) < 40,
  );

  // Which input drags the class down most, averaged across students.
  const avg = (pick: (s: (typeof scored)[number]) => number) =>
    scored.length ? scored.reduce((t, s) => t + pick(s), 0) / scored.length : 0;

  const classInputs = [
    { key: "hours" as const, score: avg((s) => s.level!.hoursScore) },
    { key: "vocab" as const, score: avg((s) => s.level!.vocabScore) },
    { key: "exam" as const, score: avg((s) => s.level!.examScore) },
    { key: "coverage" as const, score: avg((s) => s.level!.coverageScore) },
    { key: "grammar" as const, score: avg((s) => s.level!.grammarScore) },
  ].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm trung bình lớp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: "var(--persona)" }}>
              {classAverage}
              <span className="text-base font-normal text-muted-foreground">
                /100
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {scored.length} học sinh đã có điểm trình độ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cần chú ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--warning)]">
              {needsAttention.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {needsAttention.length === 0
                ? "Cả lớp đang học đều"
                : needsAttention.map((s) => s.name).join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cả lớp yếu nhất ở
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {INPUT_LABELS[classInputs[0].key].vi}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Trung bình {Math.round(classInputs[0].score)}/100 —{" "}
              {INPUT_LABELS[classInputs[0].key].hint}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Học sinh ({roster.length})</h2>
          <StreakCheckButton />
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b bg-black/2 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Học sinh</th>
                  <th className="px-4 py-2.5 font-medium">Trình độ</th>
                  <th className="px-4 py-2.5 font-medium">Yếu nhất</th>
                  <th className="px-4 py-2.5 font-medium">Streak</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Tuyên dương
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((student) => {
                  const weakest = student.level
                    ? weakestInput(student.level)
                    : null;
                  const flagged =
                    student.streakState !== "ACTIVE_TODAY" ||
                    (student.level?.compositeScore ?? 0) < 40;

                  return (
                    <tr
                      key={student.id}
                      className={`border-b last:border-0 ${
                        flagged ? "bg-[var(--warning)]/6" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/teacher/${teacherId}/student/${student.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <StudentAvatar
                            seed={student.avatarSeed}
                            size={38}
                            ring={student.frameColor}
                            label={student.level?.cefrBand ?? null}
                            items={student.items}
            overrides={student.overrides}
                          />
                          <span>
                            <span className="block font-medium">
                              {student.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {student.totalXp} XP
                            </span>
                          </span>
                        </Link>
                      </td>

                      <td className="w-56 px-4 py-3">
                        {student.level ? (
                          <LevelBar level={student.level} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {weakest ? (
                          <span>
                            <span className="font-medium">
                              {weakest.label.vi}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {weakest.score}/100
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StreakPill
                          streak={student.streak}
                          state={student.streakState}
                        />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <KudosButton
                          studentId={student.id}
                          studentName={student.name}
                          teacherId={teacherId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
