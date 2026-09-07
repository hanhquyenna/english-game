import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { getClassForTeacher, getStudentSummary, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { gatherLevelInputs } from "@/lib/level-service";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";
import { StudentAvatar } from "@/components/student-avatar";
import { LevelBar } from "@/components/level-bar";
import { LevelBreakdownList, WeakestHint } from "@/components/level-breakdown";
import { StreakPill } from "@/components/streak-pill";
import { KudosButton } from "@/components/teacher/kudos-button";
import { EmptyState } from "@/components/teacher/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KUDOS_LABELS } from "@/lib/personas";
import { formatMinutes, formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeacherStudentPage({
  params,
}: PageProps<"/teacher/[teacherId]/student/[studentId]">) {
  const { teacherId, studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForTeacher(teacherId),
  ]);
  if (!student || !klass) notFound();

  const db = createServerSupabase();
  const topics = await getTopicsWithProgress(klass.id, studentId);
  const topicIds = topics.map((t) => t.id);

  const [
    inputs,
    { data: kudos },
    { data: journals },
    { data: attempts },
    { data: vMasteryRaw },
    { data: gMasteryRaw },
    { data: vocabRaw },
    { data: grammarRaw },
  ] = await Promise.all([
    gatherLevelInputs(db, studentId),
    db
      .from("kudos")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("journal_entries")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("exercise_attempts")
      .select("*")
      .eq("student_id", studentId)
      .order("attempted_at", { ascending: false })
      .limit(8),
    db
      .from("vocab_mastery")
      .select("vocab_item_id, mastery_score")
      .eq("student_id", studentId),
    db
      .from("grammar_mastery")
      .select("grammar_point_id, mastery_score")
      .eq("student_id", studentId),
    topicIds.length
      ? db.from("vocab_items").select("*").in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
    topicIds.length
      ? db.from("grammar_points").select("*").in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
  ]);

  const vMasteryMap = new Map(
    (vMasteryRaw ?? []).map((m) => [m.vocab_item_id, Number(m.mastery_score)]),
  );
  const gMasteryMap = new Map(
    (gMasteryRaw ?? []).map((m) => [m.grammar_point_id, Number(m.mastery_score)]),
  );

  const allVocab = vocabRaw ?? [];
  const allGrammar = grammarRaw ?? [];

  const vMasteredCount = allVocab.filter(
    (v) => (vMasteryMap.get(v.id) ?? 0) >= MASTERY_THRESHOLD,
  ).length;
  const gMasteredCount = allGrammar.filter(
    (g) => (gMasteryMap.get(g.id) ?? 0) >= MASTERY_THRESHOLD,
  ).length;

  const raw = {
    hours: formatMinutes(inputs.studyMinutes),
    vocab: `${inputs.vocabMastered}/${inputs.vocabTotal} từ`,
    exam: inputs.examScores.length
      ? `${inputs.examScores.length} bài`
      : "chưa có",
    coverage: `${inputs.coveragePercents.length} bài học`,
    grammar: `${inputs.grammarMastered}/${inputs.grammarTotal} điểm`,
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/teacher/${teacherId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Lớp học
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-5">
          <StudentAvatar
            seed={student.avatarSeed}
            size={64}
            ring={student.frameColor}
            label={student.level?.cefrBand ?? null}
            items={student.items}
            overrides={student.overrides}
          />
          <div className="min-w-56 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{student.name}</h2>
              <StreakPill streak={student.streak} state={student.streakState} />
              <span className="text-sm text-muted-foreground">
                {student.totalXp} XP
              </span>
            </div>
            {student.level ? (
              <LevelBar level={student.level} className="mt-3" />
            ) : null}
          </div>
          <KudosButton
            studentId={student.id}
            studentName={student.name}
            teacherId={teacherId}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Điểm trình độ đến từ đâu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.level ? (
              <>
                <LevelBreakdownList level={student.level} raw={raw} />
                <WeakestHint level={student.level} />
                <p className="text-xs text-muted-foreground">
                  Một từ hoặc điểm ngữ pháp được tính là “thành thạo” khi đạt từ{" "}
                  {MASTERY_THRESHOLD}/100 trở lên.
                </p>
              </>
            ) : (
              <EmptyState text="Chưa có dữ liệu trình độ." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tiến độ theo bài học</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {topics.map((t) => (
                <li key={t.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {t.title}
                      {!t.assigned_at ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (chưa giao)
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {t.percentComplete}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(1, t.percentComplete)}%`,
                        backgroundColor: t.assigned_at
                          ? "var(--persona)"
                          : "var(--muted-foreground)",
                        opacity: t.assigned_at ? 1 : 0.35,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {(attempts ?? []).length === 0 ? (
              <EmptyState text="Chưa có lượt luyện tập nào." />
            ) : (
              <ul className="space-y-1.5 text-sm">
                {(attempts ?? []).map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    {a.correct ? (
                      <Check
                        size={15}
                        aria-hidden
                        className="text-[var(--success)]"
                      />
                    ) : (
                      <X
                        size={15}
                        aria-hidden
                        className="text-[var(--danger)]"
                      />
                    )}
                    <span className="text-muted-foreground">
                      {a.correct ? "Trả lời đúng" : "Trả lời sai"}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatWhen(a.attempted_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tuyên dương & bài viết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(kudos ?? []).length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {(kudos ?? []).map((k) => (
                  <li key={k.id} className="flex flex-wrap items-baseline gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--persona-soft)",
                        color: "var(--persona)",
                      }}
                    >
                      {KUDOS_LABELS[k.tag]}
                    </span>
                    {k.note ? (
                      <span className="text-muted-foreground">{k.note}</span>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatWhen(k.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="Chưa có tuyên dương nào." />
            )}

            {(journals ?? []).length > 0 ? (
              <ul className="space-y-2">
                {(journals ?? []).map((j) => (
                  <li key={j.id} className="rounded-md border p-2.5 text-sm">
                    <p className="line-clamp-3 whitespace-pre-wrap">{j.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatWhen(j.created_at)}
                      {j.teacher_comment ? " · đã nhận xét" : " · chưa nhận xét"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <Link
              href={`/teacher/${teacherId}/story`}
              className="inline-block text-sm underline"
              style={{ color: "var(--persona)" }}
            >
              Nhận xét bài viết ở Bảng tin →
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Bảng phủ Từ vựng &amp; Ngữ pháp (Coverage Grid)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Từ vựng ({vMasteredCount}/{allVocab.length} thành thạo)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allVocab.map((v) => {
                  const score = vMasteryMap.get(v.id) ?? 0;
                  const isMastered = score >= MASTERY_THRESHOLD;
                  return (
                    <span
                      key={v.id}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border ${
                        isMastered
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                      title={`${v.term}: ${v.meaning} (Điểm: ${score}/100)`}
                    >
                      {v.term}
                      <span className="text-[10px] opacity-75">{score}%</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ngữ pháp ({gMasteredCount}/{allGrammar.length} thành thạo)
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allGrammar.map((g) => {
                  const score = gMasteryMap.get(g.id) ?? 0;
                  const isMastered = score >= MASTERY_THRESHOLD;
                  return (
                    <span
                      key={g.id}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border ${
                        isMastered
                          ? "bg-persona-soft text-persona border-persona-border"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                      title={`${g.name} (Điểm: ${score}/100)`}
                    >
                      {g.name}
                      <span className="text-[10px] opacity-75">{score}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
