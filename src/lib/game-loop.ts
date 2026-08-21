/**
 * Game Loop v1 Core Helpers (C1 - C5)
 * Pure domain functions with full vitest coverage.
 */

export interface SkillAttempt {
  skillTag: string;
  correct: boolean;
  createdAt?: string;
}

export type SkillTag =
  | "nghe"
  | "noi"
  | "doc"
  | "viet"
  | "tu_vung"
  | "ngu_phap"
  | "phat_am";

export const SKILL_LABELS: Record<SkillTag, string> = {
  nghe: "Nghe",
  noi: "Nói",
  doc: "Đọc",
  viet: "Viết",
  tu_vung: "Từ vựng",
  ngu_phap: "Ngữ pháp",
  phat_am: "Phát âm",
};

/**
 * Case-insensitive keyword matching for C1 AI Role Play task completions.
 * Checks if transcript contains any word in keywordHints.
 */
export function matchKeywordHints(
  transcript: string,
  keywordHints: string[],
): string | null {
  if (!transcript || !keywordHints || keywordHints.length === 0) return null;
  const normalizedText = transcript.toLowerCase();

  for (const hint of keywordHints) {
    const cleanHint = hint.trim().toLowerCase();
    if (!cleanHint) continue;
    // Word boundary check or simple inclusion for short phrases
    const regex = new RegExp(`\\b${cleanHint}\\b`, "i");
    if (regex.test(normalizedText) || normalizedText.includes(cleanHint)) {
      return hint;
    }
  }
  return null;
}

/**
 * Calculates 0-5 stars mastery score for C2 Skill Boost based on accuracy
 * of up to the last 20 attempts for a specific skill_tag.
 * stars = round(5 * (correctCount / totalCount))
 */
export function calculateSkillStars(
  attempts: SkillAttempt[],
  skillTag: string,
  maxWindow = 20,
): number {
  const filtered = attempts
    .filter((a) => a.skillTag === skillTag)
    .slice(-maxWindow);

  if (filtered.length === 0) return 0;

  const correctCount = filtered.filter((a) => a.correct).length;
  const accuracy = correctCount / filtered.length;
  return Math.round(5 * accuracy);
}

/**
 * Checks if a story page read reward can be claimed.
 * 1 gem reward per page per day per student (anti-farming rule 4.2).
 */
export function canClaimStoryPageReward(
  lastClaimedDateIso: string | null | undefined,
  currentDateIso: string = new Date().toISOString(),
): boolean {
  if (!lastClaimedDateIso) return true;
  const lastDate = lastClaimedDateIso.slice(0, 10);
  const currDate = currentDateIso.slice(0, 10);
  return lastDate !== currDate;
}

/**
 * Partitions students into League Groups of up to 30 members per group,
 * clustered by CEFR Band (C4 League Tier).
 */
export function partitionLeagueGroups<T extends { id: string; cefrBand?: string }>(
  students: T[],
  groupSize = 30,
): T[][] {
  const groups: T[][] = [];
  let currentGroup: T[] = [];

  for (const student of students) {
    currentGroup.push(student);
    if (currentGroup.length >= groupSize) {
      groups.push(currentGroup);
      currentGroup = [];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups.length > 0 ? groups : [[]];
}

/**
 * Calculates Buddy Pet stage according to streak_count and stage thresholds.
 */
export function calculatePetStage(
  streakCount: number,
  thresholds: { stage: number; min_streak: number }[] = [
    { stage: 1, min_streak: 0 },
    { stage: 2, min_streak: 7 },
    { stage: 3, min_streak: 21 },
  ],
): number {
  const sorted = [...thresholds].sort((a, b) => b.min_streak - a.min_streak);
  for (const t of sorted) {
    if (streakCount >= t.min_streak) {
      return t.stage;
    }
  }
  return 1;
}
