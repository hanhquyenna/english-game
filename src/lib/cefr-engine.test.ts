import { describe, expect, it } from "vitest";
import {
  calculateCefrProgress,
  calculateLearnedVocabCount,
  calculateLessonXpAward,
  DEFAULT_CEFR_THRESHOLDS,
  type VocabReviewLogEntry,
} from "./cefr-engine";

describe("cefr-engine", () => {
  it("calculates CEFR progress correctly based on XP threshold", () => {
    // 0 XP -> A1 0% towards 200 XP
    const p0 = calculateCefrProgress(0, DEFAULT_CEFR_THRESHOLDS);
    expect(p0.currentBand).toBe("A1");
    expect(p0.nextBand).toBe("A1");
    expect(p0.percentage).toBe(0);

    // 100 XP -> 50% towards 200 XP
    const p100 = calculateCefrProgress(100, DEFAULT_CEFR_THRESHOLDS);
    expect(p100.percentage).toBe(50);

    // 200 XP -> A1 achieved, now towards A2 (400 XP target, range 200, 0% into A2)
    const p200 = calculateCefrProgress(200, DEFAULT_CEFR_THRESHOLDS);
    expect(p200.currentBand).toBe("A1");
    expect(p200.nextBand).toBe("A2");
    expect(p200.bandXp).toBe(0);
    expect(p200.percentage).toBe(0);

    // 300 XP -> A1 achieved, 100 XP into A2 band (range 200 XP -> 50% into A2)
    const p300 = calculateCefrProgress(300, DEFAULT_CEFR_THRESHOLDS);
    expect(p300.currentBand).toBe("A1");
    expect(p300.nextBand).toBe("A2");
    expect(p300.bandXp).toBe(100);
    expect(p300.nextBandXpRequired).toBe(200);
    expect(p300.percentage).toBe(50);
  });

  it("enforces replay XP rule (max 20%, 1x per day)", () => {
    // First time
    const first = calculateLessonXpAward(100, false, false);
    expect(first.amount).toBe(100);
    expect(first.source).toBe("lesson_first");

    // Replay 1st time today
    const replay1 = calculateLessonXpAward(100, true, false);
    expect(replay1.amount).toBe(20);
    expect(replay1.source).toBe("lesson_replay");

    // Replay 2nd time today
    const replay2 = calculateLessonXpAward(100, true, true);
    expect(replay2.amount).toBe(0);
  });

  it("calculates learned vocab count (>= 2 consecutive remembered)", () => {
    const logs: VocabReviewLogEntry[] = [
      // Vocab 1: remembered 2 times consecutively -> LEARNED
      { vocab_id: "v1", result: "remembered", created_at: "2026-08-01T10:00:00Z" },
      { vocab_id: "v1", result: "remembered", created_at: "2026-08-02T10:00:00Z" },

      // Vocab 2: remembered then forgot then remembered -> NOT LEARNED (consecutive reset)
      { vocab_id: "v2", result: "remembered", created_at: "2026-08-01T10:00:00Z" },
      { vocab_id: "v2", result: "forgot", created_at: "2026-08-02T10:00:00Z" },
      { vocab_id: "v2", result: "remembered", created_at: "2026-08-03T10:00:00Z" },

      // Vocab 3: forgot then remembered 2 times -> LEARNED
      { vocab_id: "v3", result: "forgot", created_at: "2026-08-01T10:00:00Z" },
      { vocab_id: "v3", result: "remembered", created_at: "2026-08-02T10:00:00Z" },
      { vocab_id: "v3", result: "remembered", created_at: "2026-08-03T10:00:00Z" },
    ];

    const count = calculateLearnedVocabCount(logs);
    expect(count).toBe(2);
  });
});
