/**
 * SM-2 Spaced Repetition System algorithm & Mastery calculation.
 */

export type ReviewItem = {
  id: string;
  type: "vocab" | "grammar";
  term: string;
  meaningOrExplanation: string;
  example?: string | null;
  masteryScore: number;
  lastReviewedAt: string | null;
};

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Calculates new mastery score (0–100) after a review attempt based on SM-2 quality (0–5).
 */
export function calculateNextMastery(currentMastery: number, quality: Quality): number {
  let delta = 0;
  if (quality >= 5) delta = 20;
  else if (quality === 4) delta = 12;
  else if (quality === 3) delta = 5;
  else if (quality === 2) delta = -10;
  else delta = -20;

  return Math.max(0, Math.min(100, Math.round(currentMastery + delta)));
}

/**
 * Sorts items by urgency: items with lower mastery or older last_reviewed_at surface first.
 */
export function sortForReview<T extends ReviewItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Unreviewed items first
    if (!a.lastReviewedAt && b.lastReviewedAt) return -1;
    if (a.lastReviewedAt && !b.lastReviewedAt) return 1;

    // Lowest mastery score next
    if (a.masteryScore !== b.masteryScore) {
      return a.masteryScore - b.masteryScore;
    }

    // Oldest lastReviewedAt next
    const dateA = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const dateB = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
    return dateA - dateB;
  });
}
