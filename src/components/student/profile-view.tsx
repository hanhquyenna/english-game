import Link from "next/link";
import { ArrowLeft, LogOut, ShoppingBag, User, Zap } from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import {
  Mono,
  PageTitle,
  PageTitleSmall,
  SectionLabel,
  Tile,
} from "@/components/student/ui";
import { STREAK_MILESTONES } from "@/lib/tiers";
import type { StudentSummary } from "@/lib/queries";
import { formatDate } from "@/lib/format";

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

  const currentScore = Math.round(student.level?.compositeScore ?? 340);
  const currentLevel = Math.floor(currentScore / 100) + 1;
  const currentExp = currentScore % 100;
  const expTarget = 100;
  const expPercent = Math.min(100, Math.max(10, Math.round((currentExp / expTarget) * 100)));
  const expNeeded = expTarget - currentExp;

  const stats = [
    { value: `${student.streak} days`, label: "Daily Learning Streak" },
    { value: `Level ${currentLevel}`, label: "Current Level" },
    { value: `${vocabMastered} words`, label: "Mastered Words" },
    { value: `${earned} badges`, label: "Badges Earned" },
  ];

  const translateComment = (txt: string) => {
    if (txt.includes("Học đều 12 ngày")) return "Great job studying 12 days in a row, super consistent!";
    if (txt.includes("Rất tốt Minh")) return "Very good Minh! Great usage of vocabulary. Next time try adding formal and informal expressions.";
    return txt;
  };

  return (
    <div className="pb-[125px] pt-2 space-y-4">
      {/* HEADER WITH QUIT TO MAP BUTTON */}
      {isMe ? (
        <div className="flex items-center justify-between border-b-2 border-st-fg pb-4">
          <div>
            <PageTitle>Student Profile</PageTitle>
          </div>
          <Link href={`/student/${viewerId}`}>
            <button className="flex items-center gap-2 rounded-xl border-2 border-st-fg bg-st-primary px-4 py-2 text-xs font-black uppercase text-st-primary-fg shadow-md transition-transform active:scale-95">
              <LogOut size={16} />
              <span>QUIT TO MAP</span>
            </button>
          </Link>
        </div>
      ) : (
        <Link
          href={`/student/${viewerId}/rank`}
          className="mb-2 flex min-h-[36px] items-center transition-opacity active:opacity-70"
        >
          <ArrowLeft size={19} style={{ color: "var(--st-primary)" }} />
          <PageTitleSmall>Leaderboard</PageTitleSmall>
        </Link>
      )}

      {/* STUDENT PROFILE HERO */}
      <div className="flex flex-col items-center py-[13px] text-center">
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
        <p className="st-display mt-[11px] text-[24px] font-black text-st-fg">
          {student.name}
        </p>

        {/* LEVEL & EXP PROGRESS BAR SYSTEM (REPLACING CLASS/CEFR TEXT & GEMS) */}
        <div className="mt-3 w-full max-w-sm flex flex-col items-center space-y-1.5 bg-st-card p-3 rounded-2xl border-2 border-st-fg shadow-sm">
          <div className="flex items-center justify-between w-full text-xs font-black">
            <span className="st-display text-st-fg uppercase">Level {currentLevel} • CEFR {student.level?.cefrBand ?? "B2"}</span>
            <Mono className="text-st-primary">{currentExp} / {expTarget} EXP</Mono>
          </div>

          <div className="w-full h-3.5 rounded-full bg-st-bg border-2 border-st-fg overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-st-primary transition-all duration-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>

          <Mono className="text-[10px] text-st-muted-fg font-extrabold">
            +{expNeeded} EXP needed to reach Level {currentLevel + 1}
          </Mono>
        </div>

        <span
          className="mt-[11px] px-3 py-1 rounded-full border-2 border-st-fg shadow-xs"
          style={{ backgroundColor: "var(--st-lavender)" }}
        >
          <Mono style={{ color: "var(--st-primary)" }} className="font-extrabold text-xs">
            Rank #{rank} in class
          </Mono>
        </span>

        {isMe ? (
          <div className="mt-[13px] flex gap-2">
            <Link
              href={`/student/${viewerId}/avatar`}
              className="flex min-h-[34px] items-center gap-[5px] rounded-lg border-2 border-st-fg px-3 text-xs font-black uppercase transition-opacity active:opacity-70 bg-st-card text-st-fg"
            >
              <User size={15} style={{ color: "var(--st-primary)" }} />
              <span>Change avatar</span>
            </Link>
            <Link
              href={`/student/${viewerId}/shop`}
              className="flex min-h-[34px] items-center gap-[5px] rounded-lg border-2 border-st-fg px-3 text-xs font-black uppercase transition-opacity active:opacity-70 bg-st-accent text-st-fg"
            >
              <ShoppingBag size={15} style={{ color: "var(--st-fg)" }} />
              <span>Avatar shop</span>
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
            <Mono className="text-st-muted-fg text-center">{s.label}</Mono>
          </Tile>
        ))}
      </div>

      <SectionLabel>Streak badges</SectionLabel>
      <div className="flex gap-[22px] overflow-x-auto px-2 py-3">
        {STREAK_MILESTONES.map((m) => {
          const has = student.streak >= m.days;
          return (
            <div key={m.days} className="flex shrink-0 flex-col items-center gap-1.5">
              <span
                className="flex size-14 rotate-[30deg] items-center justify-center border-2 border-st-fg shadow-sm"
                style={{
                  backgroundColor: has
                    ? "var(--st-accent)"
                    : "var(--st-muted)",
                }}
              >
                <span
                  className="st-display -rotate-[30deg] text-[18px] font-black"
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
              {translateComment(c.text)}
            </p>
          </Tile>
        ))
      )}
    </div>
  );
}
