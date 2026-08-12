import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { Segmented } from "@/components/student/segmented";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  title: string;
  detail: string;
  status: "DONE" | "PENDING" | "UPCOMING";
  href?: string;
  square: boolean;
  tagBg: string;
};

const STATUS_STYLE = {
  DONE: { color: "#2f8a3f", bg: "#e6f9ea" },
  PENDING: { color: "#c9820a", bg: "#fff2df" },
  UPCOMING: { color: "#534ab7", bg: "#f4f1ff" },
} as const;

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

  const [{ data: exams }, { data: submissions }] = await Promise.all([
    db
      .from("exams")
      .select("*")
      .eq("class_id", klass.id)
      .order("created_at", { ascending: false }),
    db.from("submissions").select("*").eq("student_id", studentId),
  ]);

  const submissionByExam = new Map(
    (submissions ?? []).map((s) => [s.exam_id, s]),
  );

  // "Homework" is the work the teacher has assigned: units to finish.
  const homework: Row[] = assigned.map((t) => ({
    title: t.title,
    detail:
      t.percentComplete >= 100
        ? "Completed · 100%"
        : `${t.percentComplete}% complete`,
    status: t.percentComplete >= 100 ? "DONE" : "PENDING",
    href: `/student/${studentId}/practice/${t.id}`,
    square: true,
    tagBg: t.percentComplete >= 100 ? "#58c96a" : "#ffd54a",
  }));

  const examRows: Row[] = (exams ?? []).map((e) => {
    const sub = submissionByExam.get(e.id);
    if (sub && sub.score !== null) {
      return {
        title: e.title,
        detail: `Completed · ${Math.round(Number(sub.score))}%`,
        status: "DONE",
        square: true,
        tagBg: "#58c96a",
      };
    }
    if (sub) {
      return {
        title: e.title,
        detail: "Submitted · waiting for your teacher to mark it",
        status: "PENDING",
        square: true,
        tagBg: "#ffd54a",
      };
    }
    return {
      title: e.title,
      detail: e.published_at
        ? `Open since ${formatDate(e.published_at)}`
        : "Not published yet",
      status: "UPCOMING",
      square: true,
      tagBg: "#534ab7",
    };
  });

  const rows = active === "exam" ? examRows : homework;

  return (
    <div>
      <h1 className="px-4 pt-4 font-display text-xl font-extrabold text-[#2a2540]">
        Challenges
      </h1>

      <Segmented
        basePath={`/student/${studentId}/challenges`}
        active={active}
        tabs={[
          { key: "homework", label: "Homework" },
          { key: "exam", label: "Exams" },
        ]}
      />

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[#8b83c4]">
          {active === "exam"
            ? "No exams yet. Your teacher will publish one when the unit is ready."
            : "No homework assigned yet."}
        </p>
      ) : (
        <ul className="space-y-2.5 px-4 pb-4">
          {rows.map((row, i) => {
            const style = STATUS_STYLE[row.status];
            const inner = (
              <span className="flex items-center gap-3 rounded-xl border border-[#ece8fb] bg-white px-3.5 py-3">
                <span
                  aria-hidden
                  className="size-9 shrink-0"
                  style={{
                    background: row.tagBg,
                    borderRadius: row.square ? 6 : "50%",
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-[#2a2540]">
                    {row.title}
                  </span>
                  <span className="block truncate text-[12px] text-[#8b83c4]">
                    {row.detail}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                  style={{ color: style.color, background: style.bg }}
                >
                  {row.status}
                </span>
              </span>
            );

            return (
              <li key={`${row.title}-${i}`}>
                {row.href ? (
                  <Link href={row.href} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
