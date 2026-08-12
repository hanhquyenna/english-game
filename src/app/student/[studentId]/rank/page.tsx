import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassForStudent, getRoster } from "@/lib/queries";
import { StudentAvatar } from "@/components/student-avatar";
import { Segmented } from "@/components/student/segmented";
import { tierForIndex } from "@/lib/tiers";

export const dynamic = "force-dynamic";

/**
 * Class leaderboard. "Total stars" ranks by the composite level score — the
 * same number the teacher and parent see — so the thing worth competing on is
 * the thing the product actually measures. "Day streak" ranks by persistence.
 */
export default async function RankPage({
  params,
  searchParams,
}: PageProps<"/student/[studentId]/rank">) {
  const { studentId } = await params;
  const { tab } = await searchParams;
  const active = tab === "streak" ? "streak" : "stars";

  const klass = await getClassForStudent(studentId);
  if (!klass) notFound();

  const roster = await getRoster(klass.id);
  const ranked = [...roster].sort((a, b) =>
    active === "streak"
      ? b.streak - a.streak
      : (b.level?.compositeScore ?? 0) - (a.level?.compositeScore ?? 0),
  );

  const value = (s: (typeof ranked)[number]) =>
    active === "streak" ? s.streak : (s.level?.compositeScore ?? 0);
  const unit = active === "streak" ? "days" : "pts";

  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean);

  return (
    <div>
      <h1 className="px-4 pt-4 font-display text-xl font-extrabold text-[#2a2540]">
        Class ranking
      </h1>

      <Segmented
        basePath={`/student/${studentId}/rank`}
        active={active}
        tabs={[
          { key: "stars", label: "Total stars" },
          { key: "streak", label: "Day streak" },
        ]}
      />

      <div className="flex items-end justify-center gap-3 px-4 pb-4">
        {podium.map((s) => {
          const place = ranked.indexOf(s) + 1;
          const t = tierForIndex(place - 1);
          const height = place === 1 ? 88 : place === 2 ? 68 : 58;
          return (
            <Link
              key={s.id}
              href={
                s.id === studentId
                  ? `/student/${studentId}/profile`
                  : `/student/${studentId}/profile/${s.id}`
              }
              className="flex w-1/3 flex-col items-center"
            >
              {place === 1 ? (
                <span className="mb-0.5 text-lg" aria-hidden>
                  👑
                </span>
              ) : null}
              <StudentAvatar
                seed={s.avatarSeed}
                overrides={s.overrides}
                items={s.items}
                size={place === 1 ? 64 : 52}
                ring={t.ring}
                ringWidth={place === 1 ? 4 : 3}
              />
              <span className="mt-1.5 max-w-full truncate text-[12px] font-bold text-[#2a2540]">
                {s.name}
              </span>
              <span className="font-display text-[13px] font-extrabold text-[#8b83c4]">
                {value(s)}
              </span>
              <span
                className="mt-1 flex w-full items-start justify-center rounded-t-lg pt-1.5 font-display text-lg font-black"
                style={{
                  height,
                  background:
                    place === 1
                      ? "rgba(255,213,74,.22)"
                      : place === 2
                        ? "#f1efee"
                        : "rgba(240,140,110,.18)",
                  color:
                    place === 1
                      ? "#c9820a"
                      : place === 2
                        ? "#8b83c4"
                        : "#d4703f",
                }}
              >
                {place}
              </span>
            </Link>
          );
        })}
      </div>

      <ul className="space-y-2 px-4 pb-4">
        {ranked.map((s, i) => {
          const t = tierForIndex(i);
          const me = s.id === studentId;
          return (
            <li key={s.id}>
              <Link
                href={
                  me
                    ? `/student/${studentId}/profile`
                    : `/student/${studentId}/profile/${s.id}`
                }
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                style={{
                  background: me ? "#f4f1ff" : "#fff",
                  borderColor: me ? "#d3caf7" : "#ece8fb",
                }}
              >
                <span className="w-5 shrink-0 text-center font-display text-[14px] font-extrabold text-[#8b83c4]">
                  {i + 1}
                </span>
                <StudentAvatar
                  seed={s.avatarSeed}
                  overrides={s.overrides}
                  items={s.items}
                  size={40}
                  ring={t.ring}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-[#2a2540]">
                    {s.name}
                    {me ? (
                      <span className="ml-1 text-[11px] font-normal text-[#8b83c4]">
                        (you)
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[11.5px] text-[#8b83c4]">
                    {t.tier} · {s.level?.cefrBand ?? "—"} · {s.totalXp} XP
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-[15px] font-extrabold text-[#534ab7]">
                    {value(s)}
                  </span>
                  <span className="block text-[10px] text-[#a9a3cf]">
                    {unit}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
