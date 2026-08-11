import { describe, expect, it } from "vitest";
import {
  addDays,
  computeStreak,
  isoDate,
  isUnlocked,
  streakState,
  xpForAttempt,
  XP_CORRECT,
  XP_INCORRECT,
} from "./progression";

describe("addDays", () => {
  it("moves forward and backward", () => {
    expect(addDays("2026-08-11", 1)).toBe("2026-08-12");
    expect(addDays("2026-08-11", -1)).toBe("2026-08-10");
  });

  it("crosses month and year boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("isoDate", () => {
  it("formats in the demo timezone, not UTC", () => {
    // 2026-08-11T18:30Z is already the 12th in Vietnam (UTC+7).
    const at = new Date("2026-08-11T18:30:00Z");
    expect(isoDate(at)).toBe("2026-08-12");
    expect(isoDate(at, "UTC")).toBe("2026-08-11");
  });
});

describe("computeStreak", () => {
  const today = "2026-08-11";

  it("is zero when nothing has been practised", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("counts a run ending today", () => {
    const days = ["2026-08-09", "2026-08-10", "2026-08-11"];
    expect(computeStreak(days, today)).toBe(3);
  });

  it("keeps yesterday's run alive when today is not done yet", () => {
    const days = ["2026-08-09", "2026-08-10"];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("is zero once a full day has been missed", () => {
    const days = ["2026-08-08", "2026-08-09"];
    expect(computeStreak(days, today)).toBe(0);
  });

  it("stops at the first gap rather than counting all practice days", () => {
    const days = [
      "2026-08-01",
      "2026-08-02",
      // gap on the 3rd
      "2026-08-10",
      "2026-08-11",
    ];
    expect(computeStreak(days, today)).toBe(2);
  });

  it("ignores duplicate entries for the same day", () => {
    expect(computeStreak(["2026-08-11", "2026-08-11"], today)).toBe(1);
  });

  it("counts a long unbroken run", () => {
    const days = Array.from({ length: 30 }, (_, i) =>
      addDays(today, -(29 - i)),
    );
    expect(computeStreak(days, today)).toBe(30);
  });
});

describe("streakState", () => {
  const today = "2026-08-11";

  it("is active when today is done", () => {
    expect(streakState(["2026-08-11"], today)).toBe("ACTIVE_TODAY");
  });

  it("is at risk when only yesterday is done", () => {
    expect(streakState(["2026-08-10"], today)).toBe("AT_RISK");
  });

  it("is broken when neither today nor yesterday is done", () => {
    expect(streakState(["2026-08-01"], today)).toBe("BROKEN");
    expect(streakState([], today)).toBe("BROKEN");
  });
});

describe("xpForAttempt", () => {
  it("rewards a correct answer more than a wrong one", () => {
    expect(xpForAttempt(true)).toBe(XP_CORRECT);
    expect(xpForAttempt(false)).toBe(XP_INCORRECT);
    expect(XP_CORRECT).toBeGreaterThan(XP_INCORRECT);
  });

  it("still gives something for a wrong answer, so trying is never zero", () => {
    expect(xpForAttempt(false)).toBeGreaterThan(0);
  });
});

describe("isUnlocked", () => {
  const ctx = { streak: 7, totalXp: 500, cefrBand: "B1", bandRank: 2 };

  it("unlocks a streak rule at or past the threshold", () => {
    expect(isUnlocked("streak:7", ctx)).toBe(true);
    expect(isUnlocked("streak:3", ctx)).toBe(true);
    expect(isUnlocked("streak:14", ctx)).toBe(false);
  });

  it("unlocks an xp rule at or past the threshold", () => {
    expect(isUnlocked("xp:500", ctx)).toBe(true);
    expect(isUnlocked("xp:1000", ctx)).toBe(false);
  });

  it("unlocks a cefr rule by band ordering, not string compare", () => {
    expect(isUnlocked("cefr:B1", ctx)).toBe(true);
    expect(isUnlocked("cefr:A2", ctx)).toBe(true);
    expect(isUnlocked("cefr:B2", ctx)).toBe(false);
    expect(isUnlocked("cefr:C1", ctx)).toBe(false);
  });

  it("treats 'always' as unlocked and unknown rules as locked", () => {
    expect(isUnlocked("always", ctx)).toBe(true);
    expect(isUnlocked("nonsense:1", ctx)).toBe(false);
    expect(isUnlocked("", ctx)).toBe(false);
  });
});
