import Link from "next/link";
import { ArrowLeft, ShoppingBag, User } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import {
  Mono,
  PageTitleSmall,
  SectionLabel,
  Tile,
} from "@/components/student/ui";
import { STREAK_MILESTONES } from "@/lib/tiers";
import type { StudentSummary } from "@/lib/queries";
import { formatDate } from "@/lib/format";

/**
 * Profile, ported from the prototype's ProfileScreen: centred hero, a 2x2 grid
 * of stat tiles (`styles.profileStatCard`, 48% wide), a horizontal row of
 * rotated hex streak badges (`styles.hexBadge`, 56px rotated 30° with the
 * number counter-rotated), then teacher comment tiles.
 *
 * One renderer for both "me" and a classmate; a classmate's view is read-only.
 */
export function ProfileView({
  viewerId,
  student,
  rank,
  className,
  vocabMastered,
  comments,
  isMe,
}: {
  viewerId: string;
  student: StudentSummary;
  rank: number;
  className: string;
  vocabMastered: number;
  comments: { date: string; text: string }[];
  isMe: boolean;
}) {
  const earned = STREAK_MILESTONES.filter(
    (m) => student.streak >= m.days,
  ).length;

  const stats = [
    { value: student.streak, label: "Day streak" },
    { value: student.level?.compositeScore ?? 0, label: "Score" },
    { value: vocabMastered, label: "Vocab learned" },
    { value: earned, label: "Badges" },
  ];

  return (
    <div className={isMe ? "px-5 pb-[125px] pt-[18px]" : "px-5 pb-[30px] pt-[18px]"}>
      {!isMe ? (
        <Link
          href={`/student/${viewerId}/rank`}
          className="mb-2 flex min-h-[36px] items-center transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
          <PageTitleSmall>Leaderboard</PageTitleSmall>
        </Link>
      ) : null}

      <div className="flex flex-col items-center py-[13px]">
        <StudentAvatar
          seed={student.avatarSeed}
          overrides={student.overrides}
          items={student.items}
          size={96}
          shape="square"
          ring="var(--st-fg)"
          ringWidth={2}
          background="var(--st-peach)"
        />
        <p className="st-display mt-[11px] text-[23px] text-st-fg">
          {student.name}
        </p>
        <Mono className="text-st-muted-fg">
          {className} · {student.level?.cefrBand ?? "—"} learner
        </Mono>
        <span
          className="mt-[9px] px-2.5 py-1.5"
          style={{ backgroundColor: "var(--st-lavender)" }}
        >
          <Mono style={{ color: "var(--st-primary)" }}>
            Rank #{rank} in class
          </Mono>
        </span>

        {isMe ? (
          <div className="mt-[11px] flex gap-2">
            <Link
              href={`/student/${viewerId}/avatar`}
              className="flex min-h-[34px] items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-2.5 transition-opacity active:opacity-70"
              style={{ backgroundColor: "var(--st-card)" }}
            >
              <User size={15} style={{ color: "var(--st-primary)" }} />
              <Mono style={{ color: "var(--st-primary)" }}>Change avatar</Mono>
            </Link>
            <Link
              href={`/student/${viewerId}/shop`}
              className="flex min-h-[34px] items-center gap-[5px] rounded-[2px] border-2 border-st-fg px-2.5 transition-opacity active:opacity-70"
              style={{ backgroundColor: "var(--st-accent)" }}
            >
              <ShoppingBag size={15} style={{ color: "var(--st-fg)" }} />
              <Mono style={{ color: "var(--st-fg)" }}>Avatar shop</Mono>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-[9px]">
        {stats.map((s) => (
          <Tile
            key={s.label}
            className="flex w-[48%] flex-col items-center p-3"
            style={{ backgroundColor: "var(--st-card)" }}
          >
            <span className="st-display mb-1 text-[20px] text-st-fg">
              {s.value}
            </span>
            <Mono className="text-st-muted-fg">{s.label}</Mono>
          </Tile>
        ))}
      </div>

      <SectionLabel>Streak badges</SectionLabel>
      {/* A 56px square rotated 30° needs ~79px of box, so the row is padded to
          keep the corners from clipping against neighbours and the scroller. */}
      <div className="flex gap-[22px] overflow-x-auto px-2 py-3">
        {STREAK_MILESTONES.map((m) => {
          const has = student.streak >= m.days;
          return (
            <div key={m.days} className="flex shrink-0 flex-col items-center gap-1.5">
              <span
                className="flex size-14 rotate-[30deg] items-center justify-center"
                style={{
                  backgroundColor: has
                    ? "var(--st-accent)"
                    : "var(--st-muted)",
                }}
              >
                <span
                  className="st-display -rotate-[30deg] text-[18px]"
                  style={{
                    color: has ? "var(--st-fg)" : "var(--st-muted-fg)",
                  }}
                >
                  {m.days}
                </span>
              </span>
              <Mono className="text-st-muted-fg">{m.sub}</Mono>
            </div>
          );
        })}
      </div>

      <SectionLabel>Teacher&rsquo;s comments</SectionLabel>
      {comments.length === 0 ? (
        <Mono className="block text-st-muted-fg">No comments yet.</Mono>
      ) : (
        comments.map((c, i) => (
          <Tile
            key={i}
            className="mb-2.5 p-[13px]"
            style={{ backgroundColor: "var(--st-card)" }}
          >
            <Mono className="text-st-muted-fg">{formatDate(c.date)}</Mono>
            <p className="st-display mt-[5px] text-[13px] font-normal leading-[19px] text-st-fg">
              {c.text}
            </p>
          </Tile>
        ))
      )}
    </div>
  );
}
