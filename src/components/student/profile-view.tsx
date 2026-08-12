import Link from "next/link";
import { StudentAvatar } from "@/components/student-avatar";
import { LevelBar } from "@/components/level-bar";
import { BADGE_COLORS, STREAK_MILESTONES, tierForIndex } from "@/lib/tiers";
import type { StudentSummary } from "@/lib/queries";
import { formatDate } from "@/lib/format";

/**
 * One profile renderer for both "me" and a classmate — same layout, same
 * avatar component, only the data source differs. A classmate's page is
 * read-only: no shop links, no avatar editing.
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
  const tier = tierForIndex(rank - 1);
  const earned = STREAK_MILESTONES.filter((m) => student.streak >= m.days).length;

  return (
    <div className="px-4 py-4">
      {!isMe ? (
        <Link
          href={`/student/${viewerId}/rank`}
          className="text-[13px] font-bold text-[#8b83c4]"
        >
          ← Ranking
        </Link>
      ) : null}

      <section className="mt-2 flex flex-col items-center rounded-2xl border border-[#ece8fb] bg-white px-4 py-5">
        <StudentAvatar
          seed={student.avatarSeed}
          overrides={student.overrides}
          items={student.items}
          size={96}
          ring={tier.ring}
          ringWidth={4}
          glow={rank === 1 ? "0 0 0 10px rgba(255,213,74,.3)" : undefined}
        />
        <h1 className="mt-3 font-display text-xl font-extrabold text-[#2a2540]">
          {student.name}
        </h1>
        <p className="text-[13px] text-[#8b83c4]">
          {className} · Rank #{rank} · {tier.tier}
        </p>

        {student.level ? (
          <div className="mt-4 w-full">
            <LevelBar level={student.level} />
          </div>
        ) : null}

        <dl className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
          <Stat label="Day streak" value={student.streak} />
          <Stat label="Total XP" value={student.totalXp} />
          <Stat label="Words known" value={vocabMastered} />
        </dl>

        {isMe ? (
          <div className="mt-4 flex w-full gap-2">
            <Link
              href={`/student/${viewerId}/avatar`}
              className="flex-1 rounded-xl bg-[#534ab7] py-2.5 text-center text-[13px] font-bold text-white"
            >
              Change character
            </Link>
            <Link
              href={`/student/${viewerId}/shop`}
              className="flex-1 rounded-xl border border-[#ece8fb] py-2.5 text-center text-[13px] font-bold text-[#534ab7]"
            >
              Avatar shop
            </Link>
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-2xl border border-[#ece8fb] bg-[#3a3550] px-4 py-4">
        <h2 className="font-display text-[15px] font-extrabold text-white">
          Streak badges
        </h2>
        <p className="text-[12px] text-[#b9b2d8]">
          {earned} of {STREAK_MILESTONES.length} earned
        </p>
        <ul className="mt-3 flex items-end justify-between gap-2">
          {STREAK_MILESTONES.map((m, i) => {
            const locked = student.streak < m.days;
            const c = BADGE_COLORS[i];
            const size = 52 + i * 6;
            return (
              <li key={m.days} className="flex flex-col items-center gap-1">
                <span
                  className="grid place-items-center rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: locked ? "#5b5470" : c.frameBg,
                  }}
                >
                  <span
                    className="grid place-items-center rounded-full font-display font-black"
                    style={{
                      width: size - 10,
                      height: size - 10,
                      background: locked ? "#413c58" : c.innerBg,
                      color: locked ? "#8b83c4" : c.numColor,
                      fontSize: 16 + i * 2,
                    }}
                  >
                    {m.days}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-[#b9b2d8]">
                  {m.sub}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-3 rounded-2xl border border-[#ece8fb] bg-white px-4 py-4">
        <h2 className="font-display text-[15px] font-extrabold text-[#2a2540]">
          Teacher comments
        </h2>
        {comments.length === 0 ? (
          <p className="mt-1 text-[13px] text-[#8b83c4]">
            No comments yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {comments.map((c, i) => (
              <li key={i}>
                <p className="text-[11px] font-bold text-[#a9a3cf]">
                  {formatDate(c.date)}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#3a3550]">
                  {c.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f7f6fb] py-2.5">
      <dd className="font-display text-lg font-extrabold text-[#534ab7]">
        {value}
      </dd>
      <dt className="text-[10.5px] text-[#8b83c4]">{label}</dt>
    </div>
  );
}
