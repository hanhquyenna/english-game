export interface CefrThreshold {
  band: string;
  xp_required: number;
}

export const DEFAULT_CEFR_THRESHOLDS: CefrThreshold[] = [
  { band: "A1", xp_required: 200 },
  { band: "A2", xp_required: 400 },
  { band: "B1", xp_required: 600 },
  { band: "B2", xp_required: 800 },
  { band: "C1", xp_required: 1000 },
  { band: "C2", xp_required: 1500 },
];

export interface XpLedgerEntry {
  id?: string;
  student_id: string;
  source: "lesson_first" | "lesson_replay" | "journal_approved" | "speaking_graded";
  amount: number;
  ref_id?: string | null;
  created_at?: string;
}

export interface VocabReviewLogEntry {
  vocab_id: string;
  result: "remembered" | "forgot";
  created_at: string;
}

export interface CefrProgressResult {
  currentBand: string;
  nextBand: string | null;
  totalXp: number;
  bandXp: number;
  nextBandXpRequired: number;
  percentage: number;
}

/**
 * Calculates CEFR level breakdown and percentage progress based on total XP and thresholds table.
 */
export function calculateCefrProgress(
  totalXp: number,
  thresholds: CefrThreshold[] = DEFAULT_CEFR_THRESHOLDS,
): CefrProgressResult {
  const sorted = [...thresholds].sort((a, b) => a.xp_required - b.xp_required);

  let currentBand = sorted[0]?.band ?? "A1";
  let nextBand: string | null = sorted[1]?.band ?? "A2";
  let prevThreshold = 0;
  let targetThreshold = sorted[0]?.xp_required ?? 200;

  for (let i = 0; i < sorted.length; i++) {
    const thresh = sorted[i];
    if (totalXp < thresh.xp_required) {
      currentBand = i === 0 ? sorted[0].band : sorted[i - 1].band;
      nextBand = thresh.band;
      prevThreshold = i === 0 ? 0 : sorted[i - 1].xp_required;
      targetThreshold = thresh.xp_required;
      break;
    } else if (i === sorted.length - 1) {
      // Reached maximum band (C2)
      currentBand = thresh.band;
      nextBand = null;
      prevThreshold = sorted[i - 1]?.xp_required ?? 0;
      targetThreshold = thresh.xp_required;
    }
  }

  const bandRange = Math.max(1, targetThreshold - prevThreshold);
  const bandXp = Math.max(0, totalXp - prevThreshold);

  let percentage = nextBand === null ? 100 : (bandXp / bandRange) * 100;
  percentage = Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));

  return {
    currentBand,
    nextBand,
    totalXp,
    bandXp,
    nextBandXpRequired: bandRange,
    percentage,
  };
}

/**
 * Computes XP to award for a lesson attempt according to FRS §6.1 rule.
 * 1st time = 100% standard XP. Replay = max 20% standard XP, max 1x/day for same lesson.
 */
export function calculateLessonXpAward(
  standardXp: number,
  isReplay: boolean,
  alreadyReplayedToday: boolean,
): { amount: number; source: "lesson_first" | "lesson_replay" } {
  if (!isReplay) {
    return { amount: standardXp, source: "lesson_first" };
  }
  if (alreadyReplayedToday) {
    return { amount: 0, source: "lesson_replay" };
  }
  const replayXp = Math.floor(standardXp * 0.2);
  return { amount: replayXp, source: "lesson_replay" };
}

/**
 * Computes count of learned vocabulary items according to FRS §6.4 rule.
 * Word is learned if >= 2 consecutive 'remembered' entries in review log.
 */
export function calculateLearnedVocabCount(logs: VocabReviewLogEntry[]): number {
  const logMap = new Map<string, VocabReviewLogEntry[]>();

  for (const log of logs) {
    const list = logMap.get(log.vocab_id) ?? [];
    list.push(log);
    logMap.set(log.vocab_id, list);
  }

  let learnedCount = 0;

  for (const [, vocabLogs] of logMap.entries()) {
    // Sort ascending by creation time
    vocabLogs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let consecutiveRemembered = 0;
    for (const entry of vocabLogs) {
      if (entry.result === "remembered") {
        consecutiveRemembered++;
      } else {
        consecutiveRemembered = 0;
      }
    }

    if (consecutiveRemembered >= 2) {
      learnedCount++;
    }
  }

  return learnedCount;
}
