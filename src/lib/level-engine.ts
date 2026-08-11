/**
 * The Level Engine (§2 of the build plan).
 *
 * A student's English level is a weighted composite of five measured inputs,
 * mapped to a CEFR band. The whole demo rests on this number being real and
 * explainable, so this module is deliberately pure: no database, no I/O, no
 * clock. Everything it needs arrives as `LevelInputs`, which makes the weight
 * formula unit-testable on its own (§9, Phase 1).
 *
 * Persisting the result and gathering the inputs live in `level-service.ts`.
 */

export const LEVEL_WEIGHTS = {
  hours: 0.2,
  vocab: 0.25,
  exam: 0.25,
  coverage: 0.15,
  grammar: 0.15,
} as const;

export type LevelInputKey = keyof typeof LEVEL_WEIGHTS;

/** A vocab/grammar item counts as "mastered" at or above this mastery score. */
export const MASTERY_THRESHOLD = 80;

/**
 * Expected study hours to progress out of a given band. Used to normalise
 * time-on-task into a 0-100 score.
 *
 * This is keyed off the *class's* CEFR level rather than the student's own
 * computed band on purpose: hoursScore feeds the composite that decides the
 * band, so keying it off the student's band would make the formula circular.
 */
export const EXPECTED_HOURS_BY_BAND: Record<string, number> = {
  A1: 60,
  A2: 90,
  B1: 120,
  B2: 180,
  C1: 240,
  C2: 300,
};

/** CEFR band thresholds against the 0-100 composite (§2). */
export const CEFR_BANDS = [
  { band: "A1", min: 0 },
  { band: "A2", min: 20 },
  { band: "B1", min: 40 },
  { band: "B2", min: 60 },
  { band: "C1", min: 75 },
  { band: "C2", min: 90 },
] as const;

export type CefrBand = (typeof CEFR_BANDS)[number]["band"];

export type LevelInputs = {
  /** Total logged practice minutes, all time. */
  studyMinutes: number;
  /** Level-appropriate vocab items available to this student. */
  vocabTotal: number;
  /** ...of which this many are at or above MASTERY_THRESHOLD. */
  vocabMastered: number;
  /** Graded exam scores, each 0-100. Ungraded submissions are excluded. */
  examScores: number[];
  /** percent_complete (0-100) for each topic assigned to the student. */
  coveragePercents: number[];
  /** Level-appropriate grammar points available to this student. */
  grammarTotal: number;
  /** ...of which this many are at or above MASTERY_THRESHOLD. */
  grammarMastered: number;
  /** Expected hours to clear the class's band. Defaults to B1's 120. */
  expectedHours?: number;
};

export type LevelBreakdown = {
  compositeScore: number;
  cefrBand: CefrBand;
  /** 0-100: how far through the current band the composite sits. */
  progressToNextBand: number;
  /** The next band up, or null at C2. */
  nextBand: CefrBand | null;
  hoursScore: number;
  vocabScore: number;
  examScore: number;
  coverageScore: number;
  grammarScore: number;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const ratio = (part: number, whole: number) =>
  whole <= 0 ? 0 : clamp((part / whole) * 100);

/** Map a 0-100 composite onto its CEFR band. */
export function bandForScore(score: number): CefrBand {
  let result: CefrBand = CEFR_BANDS[0].band;
  for (const b of CEFR_BANDS) {
    if (score >= b.min) result = b.band;
  }
  return result;
}

/** The five sub-scores, each independently 0-100. */
export function computeSubScores(inputs: LevelInputs) {
  const expectedHours = inputs.expectedHours ?? EXPECTED_HOURS_BY_BAND.B1;

  return {
    hoursScore: round1(
      ratio(Math.max(0, inputs.studyMinutes) / 60, expectedHours),
    ),
    vocabScore: round1(ratio(inputs.vocabMastered, inputs.vocabTotal)),
    examScore: round1(clamp(mean(inputs.examScores))),
    coverageScore: round1(clamp(mean(inputs.coveragePercents))),
    grammarScore: round1(ratio(inputs.grammarMastered, inputs.grammarTotal)),
  };
}

/**
 * The composite: 0.20·hours + 0.25·vocab + 0.25·exam + 0.15·coverage + 0.15·grammar
 */
export function computeLevel(inputs: LevelInputs): LevelBreakdown {
  const sub = computeSubScores(inputs);

  const compositeScore = round1(
    clamp(
      sub.hoursScore * LEVEL_WEIGHTS.hours +
        sub.vocabScore * LEVEL_WEIGHTS.vocab +
        sub.examScore * LEVEL_WEIGHTS.exam +
        sub.coverageScore * LEVEL_WEIGHTS.coverage +
        sub.grammarScore * LEVEL_WEIGHTS.grammar,
    ),
  );

  const cefrBand = bandForScore(compositeScore);
  const idx = CEFR_BANDS.findIndex((b) => b.band === cefrBand);
  const current = CEFR_BANDS[idx];
  const next = idx < CEFR_BANDS.length - 1 ? CEFR_BANDS[idx + 1] : null;

  const progressToNextBand = next
    ? round1(
        clamp(
          ((compositeScore - current.min) / (next.min - current.min)) * 100,
        ),
      )
    : 100;

  return {
    compositeScore,
    cefrBand,
    progressToNextBand,
    nextBand: next?.band ?? null,
    ...sub,
  };
}

export const INPUT_LABELS: Record<
  LevelInputKey,
  { en: string; vi: string; hint: string }
> = {
  hours: {
    en: "Study hours",
    vi: "Giờ học",
    hint: "Luyện tập thêm mỗi ngày để tăng giờ học.",
  },
  vocab: {
    en: "Vocabulary",
    vi: "Từ vựng",
    hint: "Ôn thẻ từ vựng để nâng mức thành thạo.",
  },
  exam: {
    en: "Exam marks",
    vi: "Điểm thi",
    hint: "Làm bài kiểm tra sắp tới để cải thiện điểm.",
  },
  coverage: {
    en: "Curriculum coverage",
    vi: "Chương trình",
    hint: "Hoàn thành các bài học đã được giao.",
  },
  grammar: {
    en: "Grammar points",
    vi: "Ngữ pháp",
    hint: "Luyện các bài ngữ pháp để nắm chắc điểm ngữ pháp.",
  },
};

/**
 * The single weakest input — this is what the student's "how to level up"
 * hint and the teacher's "what's dragging this student down" column both read.
 *
 * Ties break by weight (heavier input first), because moving a 25%-weighted
 * input is worth more to the composite than moving a 15%-weighted one.
 */
export function weakestInput(breakdown: LevelBreakdown): {
  key: LevelInputKey;
  score: number;
  label: { en: string; vi: string; hint: string };
} {
  const entries: Array<{ key: LevelInputKey; score: number }> = [
    { key: "hours", score: breakdown.hoursScore },
    { key: "vocab", score: breakdown.vocabScore },
    { key: "exam", score: breakdown.examScore },
    { key: "coverage", score: breakdown.coverageScore },
    { key: "grammar", score: breakdown.grammarScore },
  ];

  entries.sort(
    (a, b) => a.score - b.score || LEVEL_WEIGHTS[b.key] - LEVEL_WEIGHTS[a.key],
  );

  const winner = entries[0];
  return { ...winner, label: INPUT_LABELS[winner.key] };
}

/**
 * How many composite points one input contributes right now. Drives the
 * "why is my child at this level" breakdown on the parent screen.
 */
export function contribution(
  breakdown: LevelBreakdown,
  key: LevelInputKey,
): number {
  const scores: Record<LevelInputKey, number> = {
    hours: breakdown.hoursScore,
    vocab: breakdown.vocabScore,
    exam: breakdown.examScore,
    coverage: breakdown.coverageScore,
    grammar: breakdown.grammarScore,
  };
  return round1(scores[key] * LEVEL_WEIGHTS[key]);
}

/** True when a recompute moved the student across a band boundary. */
export function didBandChange(
  previous: { cefrBand: string } | null,
  next: LevelBreakdown,
): boolean {
  return previous !== null && previous.cefrBand !== next.cefrBand;
}

/** Band ordering helper — used to tell a rank-up from a rank-down. */
export function bandIndex(band: string): number {
  return CEFR_BANDS.findIndex((b) => b.band === band);
}
