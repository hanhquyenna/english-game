import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getStudentSummary } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";

export const dynamic = "force-dynamic";

/** Account details, every row backed by a real record. */
export default async function AccountPage({
  params,
}: PageProps<"/student/[studentId]/account">) {
  const { studentId } = await params;

  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student || !klass) notFound();

  const db = createServerSupabase();
  const [{ data: links }, { data: teacher }] = await Promise.all([
    db
      .from("parent_links")
      .select("users!parent_links_parent_id_fkey(name)")
      .eq("student_id", studentId),
    db.from("users").select("name").eq("id", klass.teacher_id).maybeSingle(),
  ]);

  const parents = (links ?? [])
    .map((l) => l.users?.name)
    .filter((n): n is string => Boolean(n));

  const rows = [
    { label: "School", value: klass.school, color: "#534ab7" },
    { label: "Class", value: klass.name, color: "#3d6fe0" },
    { label: "Teacher", value: teacher?.name ?? "—", color: "#58c96a" },
    {
      label: "Parent / Guardian",
      value: parents.length ? parents.join(", ") : "Not linked",
      color: "#7d74c9",
    },
  ];

  return (
    <div className="px-4 py-4">
      <Link href={`/student/${studentId}`} className="text-[13px] font-bold text-[#8b83c4]">
        ← Learn
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <StudentAvatar
          seed={student.avatarSeed}
          overrides={student.overrides}
          items={student.items}
          size={64}
          ring="#d3caf7"
        />
        <div>
          <h1 className="font-display text-xl font-extrabold text-[#2a2540]">
            {student.name}
          </h1>
          <p className="text-[13px] text-[#8b83c4]">
            {student.level?.cefrBand ?? "—"} · {student.totalXp} XP · 🔥{" "}
            {student.streak}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center gap-3 rounded-xl border border-[#ece8fb] bg-white px-3.5 py-3"
          >
            <span
              aria-hidden
              className="size-8 shrink-0 rounded-lg"
              style={{ background: r.color, opacity: 0.18 }}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-[#a9a3cf]">
                {r.label}
              </span>
              <span className="block truncate text-[14px] font-bold text-[#2a2540]">
                {r.value}
              </span>
            </span>
          </li>
        ))}

        <li>
          <Link
            href={`/student/${studentId}/avatar`}
            className="flex items-center gap-3 rounded-xl border border-[#ece8fb] bg-white px-3.5 py-3"
          >
            <span aria-hidden className="size-8 shrink-0 rounded-lg bg-[#58c96a]/20" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-[#2a2540]">
                Change character
              </span>
              <span className="block text-[12px] text-[#8b83c4]">
                Pick a new look
              </span>
            </span>
            <span aria-hidden className="text-[#a9a3cf]">›</span>
          </Link>
        </li>

        <li>
          <Link
            href={`/student/${studentId}/shop`}
            className="flex items-center gap-3 rounded-xl border border-[#ece8fb] bg-white px-3.5 py-3"
          >
            <span aria-hidden className="size-8 shrink-0 rounded-lg bg-[#ffd54a]/40" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-[#2a2540]">
                Avatar shop
              </span>
              <span className="block text-[12px] text-[#8b83c4]">
                Hair, hats, clothes &amp; more · 💎 {student.gems}
              </span>
            </span>
            <span aria-hidden className="text-[#a9a3cf]">›</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
