import { describe, expect, it } from "vitest";
import {
  calculatePetStage,
  calculateSkillStars,
  canClaimStoryPageReward,
  matchKeywordHints,
  partitionLeagueGroups,
} from "./game-loop";

describe("Game Loop v1 Domain Logic", () => {
  describe("matchKeywordHints (C1 AI Role Play)", () => {
    it("matches keyword case-insensitively", () => {
      const result = matchKeywordHints(
        "I like my LIVING ROOM very much",
        ["kitchen", "living", "bedroom"],
      );
      expect(result).toBe("living");
    });

    it("returns null when no keyword is contained in transcript", () => {
      const result = matchKeywordHints("I am sleeping now", ["kitchen", "table"]);
      expect(result).toBeNull();
    });

    it("handles empty input gracefully", () => {
      expect(matchKeywordHints("", ["hint"])).toBeNull();
      expect(matchKeywordHints("hello", [])).toBeNull();
    });
  });

  describe("calculateSkillStars (C2 Active Practice)", () => {
    it("returns 0 when there are no attempts for the skill", () => {
      expect(calculateSkillStars([], "noi")).toBe(0);
    });

    it("calculates round(5 * accuracy) correctly for 20 attempts", () => {
      const attempts = Array.from({ length: 20 }, (_, i) => ({
        skillTag: "nghe",
        correct: i < 16, // 16/20 = 0.8 -> 4 stars
      }));
      expect(calculateSkillStars(attempts, "nghe")).toBe(4);
    });

    it("calculates 5 stars for 100% accuracy", () => {
      const attempts = Array.from({ length: 10 }, () => ({
        skillTag: "doc",
        correct: true,
      }));
      expect(calculateSkillStars(attempts, "doc")).toBe(5);
    });

    it("limits accuracy calculation to the last 20 attempts", () => {
      const oldFails = Array.from({ length: 10 }, () => ({
        skillTag: "viet",
        correct: false,
      }));
      const recentPasses = Array.from({ length: 20 }, () => ({
        skillTag: "viet",
        correct: true,
      }));
      expect(calculateSkillStars([...oldFails, ...recentPasses], "viet")).toBe(5);
    });
  });

  describe("canClaimStoryPageReward (C3 Anti-Farming)", () => {
    it("allows claim when never claimed before", () => {
      expect(canClaimStoryPageReward(null, "2026-08-15T10:00:00Z")).toBe(true);
      expect(canClaimStoryPageReward(undefined, "2026-08-15T10:00:00Z")).toBe(true);
    });

    it("prevents claim if already claimed on the same date", () => {
      expect(
        canClaimStoryPageReward(
          "2026-08-15T08:00:00Z",
          "2026-08-15T14:00:00Z",
        ),
      ).toBe(false);
    });

    it("allows claim on a new date", () => {
      expect(
        canClaimStoryPageReward(
          "2026-08-14T23:59:59Z",
          "2026-08-15T00:01:00Z",
        ),
      ).toBe(true);
    });
  });

  describe("partitionLeagueGroups (C4 Tier Leaderboard)", () => {
    it("partitions students into max 30 member groups", () => {
      const students = Array.from({ length: 65 }, (_, i) => ({
        id: `student-${i}`,
        cefrBand: "A1",
        xp: i * 10,
      }));

      const groups = partitionLeagueGroups(students, 30);
      expect(groups).toHaveLength(3);
      expect(groups[0]).toHaveLength(30);
      expect(groups[1]).toHaveLength(30);
      expect(groups[2]).toHaveLength(5);
    });

    it("handles less than 30 students in a single group", () => {
      const students = Array.from({ length: 12 }, (_, i) => ({
        id: `student-${i}`,
      }));
      const groups = partitionLeagueGroups(students, 30);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(12);
    });
  });

  describe("calculatePetStage (C5 Buddy Pet)", () => {
    it("returns correct stage based on streak count", () => {
      expect(calculatePetStage(0)).toBe(1);
      expect(calculatePetStage(5)).toBe(1);
      expect(calculatePetStage(7)).toBe(2);
      expect(calculatePetStage(15)).toBe(2);
      expect(calculatePetStage(21)).toBe(3);
      expect(calculatePetStage(50)).toBe(3);
    });
  });
});
