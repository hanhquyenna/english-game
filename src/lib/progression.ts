/**
 * Streaks, XP and avatar unlocks (§4, §6, §13).
 *
 * The date maths is pure and timezone-explicit so it can be unit-tested and so
 * the demo's "advance one day" control runs the exact same code the scheduled
 * job does — no separate fake path.
 */

/** The demo's class runs in Vietnam; "today" means today there. */
export const DEMO_TIMEZONE = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD for a moment, in the demo timezone. */
export function isoDate(at: Date = new Date(), tz = DEMO_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Shift a YYYY-MM-DD string by whole days, staying calendar-correct. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive practice days ending today — or ending yesterday when today has
 * no practice yet, which is the "still alive but at risk" case a parent is
 * warned about before it breaks.
 */
export function computeStreak(
  practiceDates: Iterable<string>,
  today: string,
): number {
  const days = new Set(practiceDates);
  const start = days.has(today) ? today : addDays(today, -1);
  if (!days.has(start)) return 0;

  let streak = 0;
  let cursor = start;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type StreakState = "ACTIVE_TODAY" | "AT_RISK" | "BROKEN";

/** Where a student stands right now, given the days they have practised. */
export function streakState(
  practiceDates: Iterable<string>,
  today: string,
): StreakState {
  const days = new Set(practiceDates);
  if (days.has(today)) return "ACTIVE_TODAY";
  if (days.has(addDays(today, -1))) return "AT_RISK";
  return "BROKEN";
}

/** XP awarded per exercise attempt. Correct answers are worth more. */
export const XP_CORRECT = 10;
export const XP_INCORRECT = 2;

export function xpForAttempt(correct: boolean): number {
  return correct ? XP_CORRECT : XP_INCORRECT;
}

/** Gems awarded for finishing a practice round — the shop's only income. */
export const GEMS_PER_ROUND = 15;

/**
 * Unlock rules are strings on the `avatars` table: "streak:7", "xp:500",
 * "cefr:B2". Evaluating them here keeps the rule data-driven — a new accessory
 * is a row, not a code change.
 */
export type UnlockContext = {
  streak: number;
  totalXp: number;
  cefrBand: string;
  bandRank: number;
};

export function isUnlocked(rule: string, ctx: UnlockContext): boolean {
  const [kind, value] = rule.split(":");
  switch (kind) {
    case "streak":
      return ctx.streak >= Number(value);
    case "xp":
      return ctx.totalXp >= Number(value);
    case "cefr": {
      const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
      const needed = order.indexOf(value);
      return needed >= 0 && ctx.bandRank >= needed;
    }
    case "always":
      return true;
    default:
      return false;
  }
}
