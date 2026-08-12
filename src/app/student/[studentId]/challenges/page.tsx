import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, FileText } from "lucide-react";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { Segmented } from "@/components/student/segmented";
import { StreakTile } from "@/components/student/streak-tile";
import {
  Mono,
  PageIntro,
  PageTitle,
  StatusChip,
  Tile,
} from "@/components/student/ui";
import { formatDate } from "@/lib/format";
import { isoDate } from "@/lib/progression";

export const dynamic = "force-dynamic";

type Row = {
  title: string;
  detail: string;
  status: "DONE" | "PENDING" | "UPCOMING";
  href?: string;
  isExam: boolean;
  tint: string;
};

/**
 * Challenges, ported from the prototype's ChallengesScreen: page title, intro,
 * dismissible accent notification tile, segmented control, then 78px rows with
 * a 42px tinted icon square and a status chip.
 */
export default async function ChallengesPage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/challenges">) {
  const { studentId } = await params;
  const { tab } = await searchParams;
  const active = tab === "exam" ? "exam" : "homework";

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const db = createServerSupabase();
  const topics = await getTopicsWithProgress(klass.id, studentId);
  const assigned = topics.filter((t) => t.assigned_at);

  const [{ data: exams }, { data: submissions }, { data: today }] =
    await Promise.all([
      db
        .from("exams")
        .select("*")
        .eq("class_id", klass.id)
        .order("created_at", { ascending: false }),
      db.from("submissions").select("*").eq("student_id", studentId),
      db
        .from("xp_events")
        .select("xp")
        .eq("student_id", studentId)
        .eq("date", isoDate())
        .maybeSingle(),
    ]);

  const submissionByExam = new Map(
    (submissions ?? []).map((s) => [s.exam_id, s]),
  );

  const homework: Row[] = assigned.map((t) => ({
    title: t.title,
    detail:
      t.percentComplete >= 100
        ? "Completed · 100%"
        : `${t.percentComplete}% complete`,
    status: t.percentComplete >= 100 ? "DONE" : "PENDING",
    href: `/student/${studentId}/practice/${t.id}`,
    isExam: false,
    tint:
      t.percentComplete >= 100 ? "var(--st-mint)" : "var(--st-accent)",
  }));

  const examRows: Row[] = (exams ?? []).map((e) => {
    const sub = submissionByExam.get(e.id);
    if (sub && sub.score !== null) {
      return {
        title: e.title,
        detail: `Completed · ${Math.round(Number(sub.score))}%`,
        status: "DONE",
        isExam: true,
        tint: "var(--st-mint)",
      };
    }
    if (sub) {
      return {
        title: e.title,
        detail: "Submitted · waiting to be marked",
        status: "PENDING",
        isExam: true,
        tint: "var(--st-peach)",
      };
    }
    return {
      title: e.title,
      detail: e.published_at
        ? `Open since ${formatDate(e.published_at)}`
        : "Not published yet",
      status: "UPCOMING",
      isExam: true,
      tint: "var(--st-primary)",
    };
  });

  const rows = active === "exam" ? examRows : homework;
  const practisedToday = Number(today?.xp ?? 0) > 0;

  return (
    <div className="px-5 pb-[30px] pt-[18px]">
      <PageTitle>Challenges</PageTitle>
      <PageIntro>Homework and exams, all in one place.</PageIntro>

      {!practisedToday ? <StreakTile /> : null}

      <Segmented
        basePath={`/student/${studentId}/challenges`}
        active={active}
        tabs={[
          { key: "homework", label: "Homework" },
          { key: "exam", label: "Exams" },
        ]}
      />

      {rows.length === 0 ? (
        <Mono className="block py-8 text-center text-st-muted-fg">
          {active === "exam"
            ? "No exams yet — your teacher will publish one when a unit is ready."
            : "No homework assigned yet."}
        </Mono>
      ) : (
        rows.map((row, i) => {
          const inner = (
            <Tile
              className="mb-2.5 flex min-h-[78px] items-center gap-3 p-[13px]"
              style={{ backgroundColor: "var(--st-card)" }}
            >
              <span
                className="flex size-[42px] shrink-0 items-center justify-center rounded-[2px]"
                style={{ backgroundColor: row.tint }}
                aria-hidden
              >
                {row.isExam ? (
                  <Award size={19} style={{ color: "var(--st-fg)" }} />
                ) : (
                  <FileText size={19} style={{ color: "var(--st-fg)" }} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="st-display mb-[3px] block truncate text-[14px] text-st-fg">
                  {row.title}
                </span>
                <Mono className="block truncate text-st-muted-fg">
                  {row.detail}
                </Mono>
              </span>
              <StatusChip status={row.status} />
            </Tile>
          );

          return row.href ? (
            <Link
              key={`${row.title}-${i}`}
              href={row.href}
              className="block transition-opacity active:opacity-70"
            >
              {inner}
            </Link>
          ) : (
            <div key={`${row.title}-${i}`}>{inner}</div>
          );
        })
      )}
    </div>
  );
}
