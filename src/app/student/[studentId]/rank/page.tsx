import Link from "next/link";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import { getClassForStudent, getRoster } from "@/lib/queries";
import { StudentAvatar } from "@/components/student-avatar";
import { Segmented } from "@/components/student/segmented";
import { Mono, PageTitle } from "@/components/student/ui";

export const dynamic = "force-dynamic";

/**
 * Leaderboard, ported from the prototype's LeaderboardScreen: 240px podium
 * with the winner's column flexed to 1.1 and bars of 92/70/58px, then 60px
 * rows with a 19px rank number.
 *
 * "Total stars" ranks by the composite level score — the same number the
 * teacher and parent see.
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

  const podium = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const rest = ranked.slice(3);

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <PageTitle>Leaderboard</PageTitle>
      <div className="mt-4">
        <Segmented
          basePath={`/student/${studentId}/rank`}
          active={active}
          tabs={[
            { key: "stars", label: "Total stars" },
            { key: "streak", label: "Day streak" },
          ]}
        />
      </div>

      <div className="mb-[14px] flex h-[240px] items-end gap-2 px-[3px]">
        {podium.map((s) => {
          const rank = ranked.indexOf(s) + 1;
          const href =
            s.id === studentId
              ? `/student/${studentId}/profile`
              : `/student/${studentId}/profile/${s.id}`;
          return (
            <Link
              key={s.id}
              href={href}
              className="flex flex-col items-center gap-[3px] transition-opacity active:opacity-70"
              style={{ flex: rank === 1 ? 1.1 : 1 }}
            >
              {rank === 1 ? (
                <Award
                  size={17}
                  style={{ color: "var(--st-accent)" }}
                  aria-hidden
                />
              ) : (
                <span className="h-[17px]" />
              )}
              <StudentAvatar
                seed={s.avatarSeed}
                overrides={s.overrides}
                items={s.items}
                size={rank === 1 ? 64 : 52}
                shape="square"
                ring="var(--st-fg)"
                ringWidth={2}
                background="var(--st-peach)"
              />
              <span className="st-display max-w-full truncate text-[14px] text-st-fg">
                {s.name}
              </span>
              <Mono style={{ color: "var(--st-primary)" }}>
                {active === "streak" ? `${s.streak} days` : `${value(s)} pts`}
              </Mono>
              <span
                className="mt-[5px] flex w-full items-end justify-center rounded-[2px] pb-2"
                style={{
                  height: rank === 1 ? 92 : rank === 2 ? 70 : 58,
                  backgroundColor:
                    rank === 1 ? "var(--st-accent)" : "var(--st-muted)",
                }}
              >
                <span className="st-display text-[22px] text-st-fg">
                  {rank}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {rest.map((s, i) => {
        const me = s.id === studentId;
        return (
          <Link
            key={s.id}
            href={
              me
                ? `/student/${studentId}/profile`
                : `/student/${studentId}/profile/${s.id}`
            }
            className="mb-2 flex min-h-[60px] items-center gap-2.5 rounded-[2px] border-2 border-st-fg px-3 transition-opacity active:opacity-70"
            style={{
              backgroundColor: me ? "var(--st-lavender)" : "var(--st-card)",
            }}
          >
            <Mono className="w-[19px] text-center font-black text-st-muted-fg">
              {i + 4}
            </Mono>
            <StudentAvatar
              seed={s.avatarSeed}
              overrides={s.overrides}
              items={s.items}
              size={38}
              shape="square"
              ring="var(--st-fg)"
              ringWidth={2}
              background="var(--st-peach)"
            />
            <span className="min-w-0 flex-1">
              <span className="st-display mb-[3px] block truncate text-[14px] text-st-fg">
                {s.name}
                {me ? " · You" : ""}
              </span>
              <Mono className="block text-st-muted-fg">
                {s.streak} day streak
              </Mono>
            </span>
            <Mono className="font-black" style={{ color: "var(--st-primary)" }}>
              {value(s)}
            </Mono>
          </Link>
        );
      })}
    </div>
  );
}
