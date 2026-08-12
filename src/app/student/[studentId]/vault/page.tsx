import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getTopicsWithProgress } from "@/lib/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { MASTERY_THRESHOLD } from "@/lib/level-engine";

export const dynamic = "force-dynamic";

/**
 * The Vault: everything the student has been taught, unit by unit.
 *
 * The design shows weeks; the real curriculum is organised into units, so each
 * assigned unit is one vault entry. Words and rules come straight from the
 * teacher's curriculum, and "mastered" uses the same threshold the Level
 * Engine scores against — so this screen and the level agree.
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

  const [{ data: vocab }, { data: grammar }, { data: vMastery }, { data: gMastery }] =
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
      db
        .from("grammar_mastery")
        .select("grammar_point_id, mastery_score")
        .eq("student_id", studentId),
    ]);

  const vScore = new Map(
    (vMastery ?? []).map((m) => [m.vocab_item_id, Number(m.mastery_score)]),
  );
  const gScore = new Map(
    (gMastery ?? []).map((m) => [m.grammar_point_id, Number(m.mastery_score)]),
  );

  const selected = typeof unit === "string" ? unit : null;
  const openTopic = topics.find((t) => t.id === selected) ?? null;

  if (openTopic) {
    const words = (vocab ?? []).filter((v) => v.topic_id === openTopic.id);
    const rules = (grammar ?? []).filter((g) => g.topic_id === openTopic.id);

    return (
      <div className="px-4 py-4">
        <Link
          href={`/student/${studentId}/vault`}
          className="text-[13px] font-bold text-[#8b83c4]"
        >
          ← Vault
        </Link>
        <h1 className="mt-2 font-display text-xl font-extrabold text-[#2a2540]">
          {openTopic.title}
        </h1>
        <p className="text-[13px] text-[#8b83c4]">
          {words.length} words · {rules.length} grammar rules
        </p>

        <section className="mt-4 rounded-xl border border-[#ece8fb] bg-white p-3.5">
          <h2 className="font-display text-[15px] font-extrabold text-[#2a2540]">
            Vocabulary
          </h2>
          <ul className="mt-2 space-y-1.5">
            {words.map((w) => {
              const score = vScore.get(w.id) ?? 0;
              const mastered = score >= MASTERY_THRESHOLD;
              return (
                <li
                  key={w.id}
                  className="flex items-baseline gap-2 text-[13px]"
                >
                  <span className="font-bold text-[#2a2540]">{w.term}</span>
                  <span className="min-w-0 flex-1 truncate text-[#8b83c4]">
                    {w.meaning}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
                    style={{
                      background: mastered ? "#e6f9ea" : "#f1efee",
                      color: mastered ? "#2f8a3f" : "#a9a3cf",
                    }}
                  >
                    {mastered ? "mastered" : `${score}/100`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-3 rounded-xl border border-[#ece8fb] bg-white p-3.5">
          <h2 className="font-display text-[15px] font-extrabold text-[#2a2540]">
            Grammar
          </h2>
          <ul className="mt-2 space-y-2.5">
            {rules.map((g) => {
              const score = gScore.get(g.id) ?? 0;
              const mastered = score >= MASTERY_THRESHOLD;
              return (
                <li key={g.id}>
                  <p className="flex items-center gap-2 text-[13px] font-bold text-[#2a2540]">
                    {g.name}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
                      style={{
                        background: mastered ? "#e6f9ea" : "#f1efee",
                        color: mastered ? "#2f8a3f" : "#a9a3cf",
                      }}
                    >
                      {mastered ? "mastered" : `${score}/100`}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#8b83c4]">
                    {g.explanation}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-xl font-extrabold text-[#2a2540]">
        Vault
      </h1>
      <p className="text-[13px] text-[#8b83c4]">
        Every word and rule you&rsquo;ve been taught, unit by unit.
      </p>

      {topics.length === 0 ? (
        <p className="py-10 text-center text-sm text-[#8b83c4]">
          Nothing saved yet — your vault fills up as your teacher assigns units.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {topics.map((t, i) => {
            const words = (vocab ?? []).filter((v) => v.topic_id === t.id);
            const rules = (grammar ?? []).filter((g) => g.topic_id === t.id);
            const mastered = words.filter(
              (w) => (vScore.get(w.id) ?? 0) >= MASTERY_THRESHOLD,
            ).length;

            return (
              <li key={t.id}>
                <Link
                  href={`/student/${studentId}/vault?unit=${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[#ece8fb] bg-white px-3.5 py-3"
                >
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f4f1ff] font-display text-[13px] font-extrabold text-[#534ab7]"
                  >
                    U{i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-[#2a2540]">
                      {t.title}
                    </span>
                    <span className="block text-[12px] text-[#8b83c4]">
                      {words.length} words · {rules.length} grammar rules ·{" "}
                      {mastered} mastered
                    </span>
                  </span>
                  <span aria-hidden className="text-[#a9a3cf]">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
