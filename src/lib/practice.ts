/**
 * Turns a topic's exercises into a bite-sized practice round (§6 student 2).
 *
 * Pure and deterministic given a seed, so the round can be built on the server,
 * handed to the client as props, and unit-tested without a DOM.
 */

import type { Enums, Json } from "@/lib/database.types";

export const ROUND_SIZE = 8;

export type Question =
  | {
      id: string;
      kind: "CHOICE";
      exerciseType: Enums<"exercise_type">;
      prompt: string;
      /** Shown above the prompt, e.g. "Từ này nghĩa là gì?" */
      instruction: string;
      options: string[];
      answerIndex: number;
      explanation?: string;
    }
  | {
      id: string;
      kind: "INPUT";
      exerciseType: Enums<"exercise_type">;
      prompt: string;
      instruction: string;
      answer: string;
      hint?: string;
    }
  | {
      id: string;
      kind: "MATCH";
      exerciseType: Enums<"exercise_type">;
      instruction: string;
      pairs: { left: string; right: string }[];
    };

export type ExerciseInput = {
  id: string;
  type: Enums<"exercise_type">;
  content: Json;
  vocab_item_id: string | null;
};

/** Small deterministic PRNG so a seeded round is reproducible in tests. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds the round. Exercises the student has not yet answered correctly come
 * first — practice should push on the weak spots rather than replay the easy
 * ones, which is also what makes the level move.
 */
export function buildRound(
  exercises: ExerciseInput[],
  options: {
    /** Exercise ids the student has already answered correctly at least once. */
    masteredIds: Set<string>;
    /** All vocab meanings in the topic, used as distractors. */
    vocabMeanings: string[];
    seed?: number;
    size?: number;
  },
): Question[] {
  const rand = mulberry32(options.seed ?? 1);
  const size = options.size ?? ROUND_SIZE;

  const unseen = exercises.filter((e) => !options.masteredIds.has(e.id));
  const seen = exercises.filter((e) => options.masteredIds.has(e.id));

  const picked = [
    ...shuffle(unseen, rand),
    ...shuffle(seen, rand),
  ].slice(0, size);

  return picked
    .map((e) => toQuestion(e, options.vocabMeanings, rand))
    .filter((q): q is Question => q !== null);
}

export type SkillTaggedExercise = ExerciseInput & {
  skill?: Enums<"exercise_skill">;
};

/**
 * Pure session generator that shuffles exercises by skill and format.
 * Guarantees no two consecutive items share a `type` (format), and balances skill coverage.
 */
export function generateShuffledSession<T extends { id: string; type: string; skill?: string }>(
  exercises: T[],
  options: { seed?: number; biasSkill?: string } = {},
): T[] {
  if (exercises.length <= 1) return [...exercises];

  const rand = mulberry32(options.seed ?? 123);
  let pool = shuffle([...exercises], rand);

  if (options.biasSkill) {
    const biased = pool.filter((e) => e.skill === options.biasSkill);
    const rest = pool.filter((e) => e.skill !== options.biasSkill);
    pool = [...biased, ...rest];
  }

  const result: T[] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    const lastType = result.length > 0 ? result[result.length - 1].type : null;
    const candidateIdx = remaining.findIndex((e) => e.type !== lastType);

    if (candidateIdx !== -1) {
      result.push(remaining.splice(candidateIdx, 1)[0]);
    } else {
      // If forced by remaining items, pick the next available
      result.push(remaining.shift()!);
    }
  }

  return result;
}

function toQuestion(
  exercise: ExerciseInput,
  vocabMeanings: string[],
  rand: () => number,
): Question | null {
  const content = (exercise.content ?? {}) as Record<string, unknown>;

  if (exercise.type === "VOCAB_CARD") {
    const term = String(content.term ?? "");
    const meaning = String(content.meaning ?? "");
    if (!term || !meaning) return null;

    // Real recall: pick three other meanings from the same topic as
    // distractors, so guessing is not free.
    const distractors = shuffle(
      vocabMeanings.filter((m) => m && m !== meaning),
      rand,
    ).slice(0, 3);

    const options = shuffle([meaning, ...distractors], rand);
    return {
      id: exercise.id,
      kind: "CHOICE",
      exerciseType: exercise.type,
      instruction: "What does this word mean?",
      prompt: term,
      options,
      answerIndex: options.indexOf(meaning),
      explanation: content.example ? String(content.example) : undefined,
    };
  }

  if (exercise.type === "MCQ") {
    const options = (content.options as string[]) ?? [];
    const answerIndex = Number(content.answerIndex ?? -1);
    if (options.length < 2 || answerIndex < 0 || answerIndex >= options.length) {
      return null;
    }
    return {
      id: exercise.id,
      kind: "CHOICE",
      exerciseType: exercise.type,
      instruction: "Select the correct answer",
      prompt: String(content.prompt ?? ""),
      options,
      answerIndex,
      explanation: content.explanation
        ? String(content.explanation)
        : undefined,
    };
  }

  if (exercise.type === "FILL_BLANK") {
    const answer = String(content.answer ?? "");
    if (!answer) return null;
    return {
      id: exercise.id,
      kind: "INPUT",
      exerciseType: exercise.type,
      instruction: "Fill in the blank",
      prompt: String(content.prompt ?? ""),
      answer,
      hint: content.hint ? String(content.hint) : undefined,
    };
  }

  const pairs = (content.pairs as { left: string; right: string }[]) ?? [];
  if (pairs.length < 2) return null;
  return {
    id: exercise.id,
    kind: "MATCH",
    exerciseType: exercise.type,
    instruction: String(content.instructions ?? "Match each word to its meaning"),
    pairs,
  };
}

/** Answer checking, shared by the UI and its tests. */
export function isAnswerCorrect(
  question: Question,
  given: number | string | Record<string, string>,
): boolean {
  if (question.kind === "CHOICE") return given === question.answerIndex;

  if (question.kind === "INPUT") {
    return normalise(String(given)) === normalise(question.answer);
  }

  const map = given as Record<string, string>;
  return question.pairs.every((p) => map[p.left] === p.right);
}

/**
 * Forgiving about how something was typed, strict about what was typed.
 *
 * Case and stray spacing are normalised, and curly apostrophes are folded to
 * straight ones — phones and macOS substitute those automatically, and marking
 * a student wrong for their keyboard's autocorrect would be a lie about what
 * they know.
 */
function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[‘’ʼ´`]/g, "'")
    .replace(/\s+/g, " ");
}
