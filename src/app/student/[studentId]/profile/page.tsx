import { notFound } from "next/navigation";
import { getStudentSummary } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { gatherLevelInputs } from "@/lib/level-service";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";
import { isUnlocked } from "@/lib/progression";
import { bandIndex } from "@/lib/level-engine";
import { StudentAvatar } from "@/components/student-avatar";
import { LevelBar } from "@/components/level-bar";
import { LevelBreakdownList, WeakestHint } from "@/components/level-breakdown";
import { StreakPill } from "@/components/streak-pill";
import { AccessoryPicker } from "@/components/student/accessory-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes, formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StudentProfile({
  params,
}: PageProps<"/student/[studentId]/profile">) {
  const { studentId } = await params;
  const student = await getStudentSummary(studentId);
  if (!student) notFound();

  const db = createServerSupabase();
  const [inputs, { data: catalogue }, { data: mine }, { data: journals }] =
    await Promise.all([
      gatherLevelInputs(db, studentId),
      db.from("avatars").select("*").eq("category", "ACCESSORY"),
      db
        .from("student_avatars")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle(),
      db
        .from("journal_entries")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

  const unlockedIds = new Set(
    Array.isArray(mine?.unlocked_accessory_ids)
      ? (mine!.unlocked_accessory_ids as string[])
      : [],
  );
  const equippedIds = Array.isArray(mine?.equipped_accessory_ids)
    ? (mine!.equipped_accessory_ids as string[])
    : [];

  const ctx = {
    streak: student.streak,
    totalXp: student.totalXp,
    cefrBand: student.level?.cefrBand ?? "A1",
    bandRank: bandIndex(student.level?.cefrBand ?? "A1"),
  };

  const accessories = (catalogue ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    emoji: a.image_url,
    rule: a.unlock_rule,
    unlocked: unlockedIds.has(a.id) || isUnlocked(a.unlock_rule, ctx),
    requirement: describeRule(a.unlock_rule),
  }));

  const raw = {
    hours: formatMinutes(inputs.studyMinutes),
    vocab: `${inputs.vocabMastered}/${inputs.vocabTotal} từ`,
    exam: inputs.examScores.length ? `${inputs.examScores.length} bài` : "chưa có",
    coverage: `${inputs.coveragePercents.length} bài học`,
    grammar: `${inputs.grammarMastered}/${inputs.grammarTotal} điểm`,
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-5">
          <StudentAvatar
            seed={student.avatarSeed}
            size={88}
            ring={student.frameColor}
            label={student.level?.cefrBand ?? null}
            items={student.items}
            overrides={student.overrides}
          />
          <div className="min-w-56 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <StreakPill streak={student.streak} state={student.streakState} />
              <span className="text-sm font-medium text-muted-foreground">
                {student.totalXp} XP
              </span>
            </div>
            {student.level ? (
              <LevelBar level={student.level} className="mt-3" />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {student.level ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Điểm trình độ của em đến từ đâu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LevelBreakdownList level={student.level} raw={raw} />
            <WeakestHint level={student.level} />
            <p className="text-xs text-muted-foreground">
              Một từ hoặc điểm ngữ pháp tính là “thành thạo” khi đạt từ{" "}
              {MASTERY_THRESHOLD}/100.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phụ kiện</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mở khoá bằng streak, XP và lên trình độ thật. Chọn tối đa 2 món để
            đeo.
          </p>
        </CardHeader>
        <CardContent>
          <AccessoryPicker
            studentId={studentId}
            accessories={accessories}
            equipped={equippedIds}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bài viết của em ({(journals ?? []).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(journals ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có bài viết nào. Sau khi luyện xong một bài học, em có thể
              viết vài câu tiếng Anh cho cô đọc.
            </p>
          ) : (
            <ul className="space-y-3">
              {(journals ?? []).map((j) => (
                <li key={j.id} className="rounded-xl border p-3">
                  <p className="whitespace-pre-wrap text-sm">{j.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatWhen(j.created_at)}
                  </p>
                  {j.teacher_comment ? (
                    <div className="mt-2 rounded-lg bg-[var(--persona-soft)] p-2.5">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--persona)" }}
                      >
                        Cô Linh nhận xét
                      </p>
                      <p className="mt-0.5 text-sm">{j.teacher_comment}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cô chưa nhận xét.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function describeRule(rule: string): string {
  const [kind, value] = rule.split(":");
  if (kind === "streak") return `Học liên tiếp ${value} ngày`;
  if (kind === "xp") return `Đạt ${value} XP`;
  if (kind === "cefr") return `Lên trình độ ${value}`;
  return "Luôn có sẵn";
}
