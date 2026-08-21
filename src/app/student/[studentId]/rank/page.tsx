import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Shield, Trophy } from "lucide-react";
import { getClassForStudent, getRoster } from "@/lib/queries";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { StudentAvatar } from "@/components/student-avatar";
import { Segmented } from "@/components/student/segmented";
import { Mono, PageTitle } from "@/components/student/ui";

export const dynamic = "force-dynamic";

export default async function RankPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { studentId } = await params;
  const { tab } = await searchParams;
  const active = tab === "tier" ? "tier" : tab === "streak" ? "streak" : "stars";

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

  const showTierTab = isFeatureEnabled("TIER_LEADERBOARD");

  const tabsList = [
    { key: "stars", label: "Total stars" },
    { key: "streak", label: "Day streak" },
  ];
  if (showTierTab) {
    tabsList.push({ key: "tier", label: "Tier League" });
  }

  return (
    <div className="px-5 pb-[125px] pt-[18px]">
      <PageTitle>Leaderboard</PageTitle>
      <div className="mt-4">
        <Segmented
          basePath={`/student/${studentId}/rank`}
          active={active}
          tabs={tabsList}
        />
      </div>

      {active === "tier" && (
        <div className="mb-4 rounded-[2px] border-2 border-st-fg bg-st-peach p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy size={16} className="text-st-primary" />
            <span className="st-display text-[15px] font-bold text-st-fg">
              Tier 1 — Nhóm CEFR A1 (Tuần này)
            </span>
          </div>
          <Mono className="text-st-muted-fg block">
            Top 20% thăng hạng • Nhóm 30 bạn cùng trình độ toàn hệ thống
          </Mono>
        </div>
      )}

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
                {active === "streak"
                  ? `${s.streak} days`
                  : active === "tier"
                    ? `${value(s) * 12} XP`
                    : `${value(s)} pts`}
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
                {me ? " · Bạn" : ""}
              </span>
              <Mono className="block text-st-muted-fg">
                {s.streak} day streak
              </Mono>
            </span>
            <Mono className="font-black" style={{ color: "var(--st-primary)" }}>
              {active === "tier" ? `${value(s) * 12} XP` : value(s)}
            </Mono>
          </Link>
        );
      })}
    </div>
  );
}
