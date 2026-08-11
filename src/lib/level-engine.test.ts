import { describe, expect, it } from "vitest";
import {
  bandForScore,
  computeLevel,
  computeSubScores,
  contribution,
  didBandChange,
  EXPECTED_HOURS_BY_BAND,
  LEVEL_WEIGHTS,
  MASTERY_THRESHOLD,
  weakestInput,
  type LevelInputs,
} from "./level-engine";

/** A student with nothing recorded yet. */
const empty: LevelInputs = {
  studyMinutes: 0,
  vocabTotal: 0,
  vocabMastered: 0,
  examScores: [],
  coveragePercents: [],
  grammarTotal: 0,
  grammarMastered: 0,
};

/** Every input maxed out. */
const perfect: LevelInputs = {
  studyMinutes: EXPECTED_HOURS_BY_BAND.B1 * 60,
  vocabTotal: 40,
  vocabMastered: 40,
  examScores: [100, 100],
  coveragePercents: [100, 100, 100],
  grammarTotal: 6,
  grammarMastered: 6,
};

describe("weights", () => {
  it("sums to exactly 1", () => {
    const total = Object.values(LEVEL_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("matches the weights specified in §2", () => {
    expect(LEVEL_WEIGHTS).toEqual({
      hours: 0.2,
      vocab: 0.25,
      exam: 0.25,
      coverage: 0.15,
      grammar: 0.15,
    });
  });
});

describe("computeSubScores", () => {
  it("returns all zeros for an empty student without dividing by zero", () => {
    const sub = computeSubScores(empty);
    expect(sub).toEqual({
      hoursScore: 0,
      vocabScore: 0,
      examScore: 0,
      coverageScore: 0,
      grammarScore: 0,
    });
    for (const v of Object.values(sub)) expect(Number.isNaN(v)).toBe(false);
  });

  it("normalises study minutes against expected hours for the band", () => {
    // Half of B1's 120 expected hours => 50.
    const sub = computeSubScores({ ...empty, studyMinutes: 60 * 60 });
    expect(sub.hoursScore).toBe(50);
  });

  it("caps hours at 100 when a student overshoots the expectation", () => {
    const sub = computeSubScores({ ...empty, studyMinutes: 10_000 * 60 });
    expect(sub.hoursScore).toBe(100);
  });

  it("respects a band-specific expectedHours override", () => {
    const sub = computeSubScores({
      ...empty,
      studyMinutes: 90 * 60,
      expectedHours: EXPECTED_HOURS_BY_BAND.A2, // 90
    });
    expect(sub.hoursScore).toBe(100);
  });

  it("scores vocab and grammar as a percentage mastered", () => {
    const sub = computeSubScores({
      ...empty,
      vocabTotal: 40,
      vocabMastered: 10,
      grammarTotal: 8,
      grammarMastered: 2,
    });
    expect(sub.vocabScore).toBe(25);
    expect(sub.grammarScore).toBe(25);
  });

  it("averages exam scores and coverage percentages", () => {
    const sub = computeSubScores({
      ...empty,
      examScores: [80, 90, 70],
      coveragePercents: [100, 50, 0],
    });
    expect(sub.examScore).toBe(80);
    expect(sub.coverageScore).toBe(50);
  });

  it("treats negative study minutes as zero rather than a negative score", () => {
    expect(computeSubScores({ ...empty, studyMinutes: -500 }).hoursScore).toBe(
      0,
    );
  });
});

describe("computeLevel", () => {
  it("puts a student with no data at A1 / 0", () => {
    const r = computeLevel(empty);
    expect(r.compositeScore).toBe(0);
    expect(r.cefrBand).toBe("A1");
  });

  it("puts a maxed-out student at C2 / 100", () => {
    const r = computeLevel(perfect);
    expect(r.compositeScore).toBe(100);
    expect(r.cefrBand).toBe("C2");
    expect(r.nextBand).toBeNull();
    expect(r.progressToNextBand).toBe(100);
  });

  it("applies the weighted formula exactly", () => {
    // Chosen so each sub-score is a distinct round number:
    // hours 50, vocab 80, exam 60, coverage 40, grammar 20
    const r = computeLevel({
      studyMinutes: 60 * 60, // 50
      vocabTotal: 10,
      vocabMastered: 8, // 80
      examScores: [60], // 60
      coveragePercents: [40], // 40
      grammarTotal: 10,
      grammarMastered: 2, // 20
    });

    expect(r.hoursScore).toBe(50);
    expect(r.vocabScore).toBe(80);
    expect(r.examScore).toBe(60);
    expect(r.coverageScore).toBe(40);
    expect(r.grammarScore).toBe(20);

    // 0.20*50 + 0.25*80 + 0.25*60 + 0.15*40 + 0.15*20
    // =   10  +    20   +    15   +    6    +    3     = 54
    expect(r.compositeScore).toBe(54);
    expect(r.cefrBand).toBe("B1");
  });

  it("reports progress through the current band", () => {
    // B1 spans 40-60, so a composite of 48 is 40% of the way to B2.
    // 0.25*100 (vocab) + 0.25*92 (exam) = 25 + 23 = 48
    const r = computeLevel({
      studyMinutes: 0,
      vocabTotal: 10,
      vocabMastered: 10,
      examScores: [92],
      coveragePercents: [],
      grammarTotal: 1,
      grammarMastered: 0,
    });
    expect(r.compositeScore).toBe(48);
    expect(r.cefrBand).toBe("B1");
    expect(r.nextBand).toBe("B2");
    expect(r.progressToNextBand).toBe(40);
  });

  it("never produces NaN for any sub-score on empty collections", () => {
    const r = computeLevel(empty);
    for (const v of Object.values(r)) {
      if (typeof v === "number") expect(Number.isNaN(v)).toBe(false);
    }
  });
});

describe("bandForScore", () => {
  it.each([
    [0, "A1"],
    [19.9, "A1"],
    [20, "A2"],
    [39.9, "A2"],
    [40, "B1"],
    [59.9, "B1"],
    [60, "B2"],
    [74.9, "B2"],
    [75, "C1"],
    [89.9, "C1"],
    [90, "C2"],
    [100, "C2"],
  ])("maps %s to %s", (score, band) => {
    expect(bandForScore(score as number)).toBe(band);
  });
});

describe("weakestInput", () => {
  it("finds the single lowest sub-score", () => {
    const r = computeLevel({
      studyMinutes: 100 * 60, // hours high
      vocabTotal: 10,
      vocabMastered: 9,
      examScores: [90],
      coveragePercents: [80],
      grammarTotal: 10,
      grammarMastered: 1, // grammar lowest at 10
    });
    expect(weakestInput(r).key).toBe("grammar");
  });

  it("breaks ties toward the heavier-weighted input", () => {
    // coverage (0.15) and exam (0.25) both land on 40; exam is worth more
    // to the composite, so that is the more useful thing to tell the user.
    const r = computeLevel({
      studyMinutes: 100 * 60,
      vocabTotal: 10,
      vocabMastered: 9,
      examScores: [40],
      coveragePercents: [40],
      grammarTotal: 10,
      grammarMastered: 9,
    });
    expect(r.examScore).toBe(40);
    expect(r.coverageScore).toBe(40);
    expect(weakestInput(r).key).toBe("exam");
  });

  it("carries a Vietnamese label and an actionable hint", () => {
    const w = weakestInput(computeLevel(empty));
    expect(w.label.vi).toBeTruthy();
    expect(w.label.hint).toBeTruthy();
  });
});

describe("contribution", () => {
  it("reports each input's share of the composite, summing to the total", () => {
    const inputs: LevelInputs = {
      studyMinutes: 60 * 60,
      vocabTotal: 10,
      vocabMastered: 8,
      examScores: [60],
      coveragePercents: [40],
      grammarTotal: 10,
      grammarMastered: 2,
    };
    const r = computeLevel(inputs);
    const sum =
      contribution(r, "hours") +
      contribution(r, "vocab") +
      contribution(r, "exam") +
      contribution(r, "coverage") +
      contribution(r, "grammar");
    expect(sum).toBeCloseTo(r.compositeScore, 5);
  });
});

describe("didBandChange", () => {
  it("is false on a student's first ever computation", () => {
    expect(didBandChange(null, computeLevel(perfect))).toBe(false);
  });

  it("detects a crossing", () => {
    expect(didBandChange({ cefrBand: "B1" }, computeLevel(perfect))).toBe(true);
  });

  it("ignores a move that stays inside the same band", () => {
    const r = computeLevel({
      ...empty,
      vocabTotal: 10,
      vocabMastered: 10,
      examScores: [92],
    });
    expect(r.cefrBand).toBe("B1");
    expect(didBandChange({ cefrBand: "B1" }, r)).toBe(false);
  });
});

describe("mastery threshold", () => {
  it("is the documented 80", () => {
    expect(MASTERY_THRESHOLD).toBe(80);
  });
});
