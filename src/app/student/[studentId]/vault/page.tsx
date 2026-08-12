import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, ChevronRight } from "lucide-react";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";
import {
  Mono,
  PageIntro,
  PageTitle,
  PageTitleSmall,
  Tile,
} from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * Learning Vault, ported from the prototype's VaultScreen.
 *
 * The prototype groups by week; the real curriculum is organised into units, so
 * one unit is one vault entry (`styles.vaultWeek`, 72px rows with a 44px badge).
 * Opening one shows `styles.vaultCategory` cards of tag chips.
 */
export default async function VaultPage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/vault">) {
  const { studentId } = await params;
  const { unit } = await searchParams;

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const db = createServerSupabase();
  const topics = (await getTopicsWithProgress(klass.id, studentId)).filter(
    (t) => t.assigned_at,
  );
  const topicIds = topics.map((t) => t.id);

  const [{ data: vocab }, { data: grammar }, { data: vMastery }] =
    await Promise.all([
      topicIds.length
        ? db.from("vocab_items").select("*").in("topic_id", topicIds)
        : Promise.resolve({ data: [] }),
      topicIds.length
        ? db.from("grammar_points").select("*").in("topic_id", topicIds)
        : Promise.resolve({ data: [] }),
      db
        .from("vocab_mastery")
        .select("vocab_item_id, mastery_score")
        .eq("student_id", studentId),
    ]);

  const vScore = new Map(
    (vMastery ?? []).map((m) => [m.vocab_item_id, Number(m.mastery_score)]),
  );

  const openTopic =
    typeof unit === "string" ? topics.find((t) => t.id === unit) : null;

  if (openTopic) {
    const words = (vocab ?? []).filter((v) => v.topic_id === openTopic.id);
    const rules = (grammar ?? []).filter((g) => g.topic_id === openTopic.id);

    return (
      <div className="px-5 pb-[125px] pt-[18px]">
        <Link
          href={`/student/${studentId}/vault`}
          className="mb-2 flex min-h-[36px] items-center transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
          <PageTitleSmall>{openTopic.title}</PageTitleSmall>
        </Link>

        <Tile
          className="mb-[14px] p-[15px]"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <div className="mb-[11px] flex items-center justify-between">
            <span className="st-display text-[14px] text-st-fg">
              Vocabulary
            </span>
            <Mono className="text-st-muted-fg">{words.length} words</Mono>
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {words.map((w) => {
              const mastered = (vScore.get(w.id) ?? 0) >= MASTERY_THRESHOLD;
              return (
                <span
                  key={w.id}
                  className="px-2.5 py-[7px]"
                  style={{
                    backgroundColor: mastered
                      ? "var(--st-mint)"
                      : "var(--st-lavender)",
                  }}
                  title={`${w.term} — ${w.meaning}${mastered ? " · mastered" : ""}`}
                >
                  <Mono
                    style={{
                      color: mastered ? "var(--st-fg)" : "var(--st-primary)",
                    }}
                  >
                    {w.term}
                  </Mono>
                </span>
              );
            })}
          </div>
        </Tile>

        <Tile
          className="mb-[14px] p-[15px]"
          style={{ backgroundColor: "var(--st-card)" }}
        >
          <div className="mb-[11px] flex items-center justify-between">
            <span className="st-display text-[14px] text-st-fg">Grammar</span>
            <Mono className="text-st-muted-fg">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </Mono>
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {rules.length === 0 ? (
              <Mono className="text-st-muted-fg">—</Mono>
            ) : (
              rules.map((g) => (
                <span
                  key={g.id}
                  className="px-2.5 py-[7px]"
                  style={{ backgroundColor: "var(--st-lavender)" }}
                  title={g.explanation}
                >
                  <Mono style={{ color: "var(--st-primary)" }}>{g.name}</Mono>
                </span>
              ))
            )}
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-[34px] items-center justify-center rounded-[2px]"
          style={{ backgroundColor: "var(--st-fg)" }}
          aria-hidden
        >
          <Archive size={18} style={{ color: "var(--st-primary-fg)" }} />
        </span>
        <PageTitle>Learning Vault</PageTitle>
      </div>
      <PageIntro>Everything you&rsquo;ve learned, organised unit by unit.</PageIntro>

      {topics.length === 0 ? (
        <Mono className="block py-8 text-center text-st-muted-fg">
          Your vault fills up as your teacher assigns units.
        </Mono>
      ) : (
        topics.map((t, i) => {
          const words = (vocab ?? []).filter((v) => v.topic_id === t.id);
          const rules = (grammar ?? []).filter((g) => g.topic_id === t.id);
          return (
            <Link
              key={t.id}
              href={`/student/${studentId}/vault?unit=${t.id}`}
              className="mb-2.5 flex min-h-[72px] items-center gap-3 rounded-[2px] border-2 border-st-fg p-[13px] transition-opacity active:opacity-70"
              style={{ backgroundColor: "var(--st-card)" }}
            >
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-[2px]"
                style={{ backgroundColor: "var(--st-lavender)" }}
                aria-hidden
              >
                <Mono style={{ color: "var(--st-primary)" }}>U{i + 1}</Mono>
              </span>
              <span className="min-w-0 flex-1">
                <span className="st-display mb-[3px] block truncate text-[14px] text-st-fg">
                  {t.title}
                </span>
                <Mono className="block text-st-muted-fg">
                  {words.length} words · {rules.length}{" "}
                  {rules.length === 1 ? "rule" : "rules"}
                </Mono>
              </span>
              <ChevronRight
                size={18}
                style={{ color: "var(--st-muted-fg)" }}
                aria-hidden
              />
            </Link>
          );
        })
      )}
    </div>
  );
}
