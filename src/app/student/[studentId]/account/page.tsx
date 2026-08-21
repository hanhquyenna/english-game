import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Phone, ShoppingBag, User, Users, X } from "lucide-react";
import { getClassForStudent, getStudentSummary } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { StudentAvatar } from "@/components/student-avatar";
import { HelpModal } from "@/components/student/help-modal";
import { Mono, PageTitle, SectionLabel, Tile } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * Account, ported from the prototype's AccountScreen: title with a close ✕,
 * an identity card, then a single tile of rows divided by hairlines.
 * Every row is backed by a real record.
 */
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
  const { data: links } = await db
    .from("parent_links")
    .select("users!parent_links_parent_id_fkey(name)")
    .eq("student_id", studentId);

  const parents = (links ?? [])
    .map((l) => l.users?.name)
    .filter((n): n is string => Boolean(n));

  const rows = [
    { label: "School", value: klass.school, Icon: Home, color: "var(--st-primary)" },
    { label: "Class", value: klass.name, Icon: Users, color: "var(--st-primary)" },
    {
      label: "Parent / Guardian",
      value: parents.length ? parents.join(", ") : "Not linked",
      Icon: Phone,
      color: "var(--st-primary)",
    },
  ];

  return (
    <div className="px-5 pb-[30px] pt-[18px]">
      <div className="flex items-center justify-between">
        <PageTitle>Account</PageTitle>
        <Link
          href={`/student/${studentId}`}
          aria-label="Close account"
          className="transition-opacity active:opacity-70"
        >
          <X size={21} style={{ color: "var(--st-primary)" }} />
        </Link>
      </div>

      <Tile
        className="mt-4 flex items-center gap-3 p-[13px]"
        style={{ backgroundColor: "var(--st-card)" }}
      >
        <StudentAvatar
          seed={student.avatarSeed}
          overrides={student.overrides}
          items={student.items}
          size={58}
          shape="square"
          ring="var(--st-fg)"
          ringWidth={2}
          background="var(--st-peach)"
        />
        <span className="min-w-0 flex-1">
          <span className="st-display block truncate text-[14px] text-st-fg">
            {student.name}
          </span>
          <Mono className="block text-st-muted-fg">{klass.name}</Mono>
        </span>
      </Tile>

      <SectionLabel>Your info</SectionLabel>

      <Tile style={{ backgroundColor: "var(--st-card)" }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-3 border-b p-[13px]"
            style={{ borderColor: "var(--st-muted)" }}
          >
            <r.Icon size={17} style={{ color: r.color }} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="st-display block text-[14px] text-st-fg">
                {r.label}
              </span>
              <Mono className="block truncate text-st-muted-fg">{r.value}</Mono>
            </span>
          </div>
        ))}

        <Link
          href={`/student/${studentId}/avatar`}
          className="flex items-center gap-3 border-b p-[13px] transition-opacity active:opacity-70"
          style={{ borderColor: "var(--st-muted)" }}
        >
          <User size={17} style={{ color: "var(--st-secondary)" }} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="st-display block text-[14px] text-st-fg">
              Change avatar
            </span>
            <Mono className="block text-st-muted-fg">Update look &amp; style</Mono>
          </span>
          <ChevronRight size={17} style={{ color: "var(--st-muted-fg)" }} aria-hidden />
        </Link>

        <Link
          href={`/student/${studentId}/shop`}
          className="flex items-center gap-3 p-[13px] transition-opacity active:opacity-70"
        >
          <ShoppingBag size={17} style={{ color: "var(--st-accent)" }} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="st-display block text-[14px] text-st-fg">
              Avatar Shop
            </span>
            <Mono className="block text-st-muted-fg">
              Hair, hats, clothes &amp; more · {student.gems} gems
            </Mono>
          </span>
          <ChevronRight size={17} style={{ color: "var(--st-muted-fg)" }} aria-hidden />
        </Link>
      </Tile>

      {/* A10 Help Modal Component */}
      <HelpModal studentId={studentId} teacherId={klass.teacher_id} />
    </div>
  );
}
