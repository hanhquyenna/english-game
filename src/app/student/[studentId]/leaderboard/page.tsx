import { notFound } from "next/navigation";
import { getClassForStudent, getRoster } from "@/lib/queries";
import { StudentAvatar } from "@/components/student-avatar";
import { StreakPill } from "@/components/streak-pill";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Small class leaderboard (§6 student 5). Ranked by composite score — the same
 * number every other screen shows — rather than by XP, so the thing worth
 * competing on is the thing the product actually measures.
 */
export default async function LeaderboardPage({
  params,
}: PageProps<"/student/[studentId]/leaderboard">) {
  const { studentId } = await params;
  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const roster = await getRoster(klass.id);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Bảng xếp hạng lớp</h2>
        <p className="text-sm text-muted-foreground">
          Xếp theo điểm trình độ — chính là con số cô giáo và bố mẹ cũng nhìn
          thấy.
        </p>
      </div>

      <ul className="space-y-2">
        {roster.map((student, i) => {
          const isMe = student.id === studentId;
          return (
            <li key={student.id}>
              <Card
                className={cn(
                  isMe && "border-[var(--persona)] bg-[var(--persona-soft)]",
                )}
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="w-7 shrink-0 text-center text-lg font-bold">
                    {medals[i] ?? i + 1}
                  </span>
                  <StudentAvatar
                    seed={student.avatarSeed}
                    size={42}
                    ring={student.frameColor}
                    label={student.level?.cefrBand ?? null}
                    items={student.items}
            overrides={student.overrides}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {student.name}
                      {isMe ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (em)
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {student.totalXp} XP
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="block text-lg font-bold"
                      style={{ color: "var(--persona)" }}
                    >
                      {student.level?.compositeScore ?? "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {student.level?.cefrBand ?? ""}
                    </span>
                  </span>
                </CardContent>
              </Card>
              {isMe ? null : null}
            </li>
          );
        })}
      </ul>

      <div className="pt-1">
        <p className="text-center text-xs text-muted-foreground">
          Streak của cả lớp
        </p>
        <ul className="mt-2 flex flex-wrap justify-center gap-2">
          {roster.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{s.name}</span>
              <StreakPill streak={s.streak} state={s.streakState} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
