import Link from "next/link";
import { getClassForTeacher, getRoster } from "@/lib/queries";
import { INPUT_LABELS } from "@/lib/level-engine";
import { StudentAvatar } from "@/components/student-avatar";
import { LevelBar } from "@/components/level-bar";
import { KudosButton } from "@/components/teacher/kudos-button";
import { StreakCheckButton } from "@/components/teacher/streak-check-button";
import { StreakPill } from "@/components/streak-pill";
import { StatusBadge } from "@/components/teacher/badges";
import { PageHeader } from "@/components/teacher/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function RosterPage({
  params,
}: PageProps<"/teacher/[teacherId]/roster">) {
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
      <PageHeader
        title="Lớp học"
        description={`Lớp ${klass.name} · ${roster.length} học sinh`}
        action={<StreakCheckButton />}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm trung bình lớp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: "var(--persona)" }}>
              {classAverage} / 100
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {scored.length}/{roster.length} học sinh đã có điểm composite
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
            <p className="text-3xl font-bold text-warning">
              {needsAttention.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {needsAttention.length > 0
                ? "Học sinh đứt streak hoặc điểm < 40"
                : "Tất cả học sinh đang học tốt"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm yếu chung của lớp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {classInputs[0]
                ? INPUT_LABELS[classInputs[0].key].vi
                : "Chưa có dữ liệu"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kỹ năng có điểm trung bình thấp nhất
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Danh sách học sinh
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học sinh</TableHead>
                <TableHead>Trình độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/teacher/${teacherId}/student/${student.id}`}
                      className="flex items-center gap-3"
                    >
                      <StudentAvatar
                        seed={student.avatarSeed}
                        overrides={student.overrides}
                        items={student.items}
                        size={36}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold hover:underline">{student.name}</p>
                        <StreakPill streak={student.streak} state={student.streakState} />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-48">
                    {student.level ? (
                      <LevelBar level={student.level} />
                    ) : (
                      <p className="text-xs text-muted-foreground">Chưa có dữ liệu đánh giá</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      score={student.level?.compositeScore ?? 0}
                      streak={student.streak}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <KudosButton
                        teacherId={teacherId}
                        studentId={student.id}
                        studentName={student.name}
                      />
                      <Link
                        href={`/teacher/${teacherId}/student/${student.id}`}
                        className="text-xs font-semibold text-[var(--persona)] hover:underline"
                      >
                        Chi tiết →
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
