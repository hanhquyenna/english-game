import { describe, expect, it } from "vitest";
import { calculateNextMastery, sortForReview, type ReviewItem } from "./sm2";

describe("calculateNextMastery", () => {
  it("increases mastery on successful ratings", () => {
    expect(calculateNextMastery(50, 5)).toBe(70);
    expect(calculateNextMastery(50, 4)).toBe(62);
    expect(calculateNextMastery(50, 3)).toBe(55);
  });

  it("decreases mastery on poor ratings", () => {
    expect(calculateNextMastery(50, 1)).toBe(30);
  });

  it("clamps mastery between 0 and 100", () => {
    expect(calculateNextMastery(90, 5)).toBe(100);
    expect(calculateNextMastery(10, 0)).toBe(0);
  });
});

describe("sortForReview", () => {
  it("prioritizes unreviewed items and low mastery", () => {
    const items: ReviewItem[] = [
      { id: "1", type: "vocab", term: "cat", meaningOrExplanation: "mèo", masteryScore: 90, lastReviewedAt: "2026-08-01T00:00:00Z" },
      { id: "2", type: "vocab", term: "dog", meaningOrExplanation: "chó", masteryScore: 40, lastReviewedAt: "2026-08-02T00:00:00Z" },
      { id: "3", type: "vocab", term: "bird", meaningOrExplanation: "chim", masteryScore: 0, lastReviewedAt: null },
    ];

    const sorted = sortForReview(items);
    expect(sorted.map((i) => i.id)).toEqual(["3", "2", "1"]);
  });
});
