import { describe, expect, it } from "vitest";
import {
  buildRound,
  generateShuffledSession,
  isAnswerCorrect,
  ROUND_SIZE,
  type ExerciseInput,
  type Question,
} from "./practice";

const vocabCard = (id: string, term: string, meaning: string): ExerciseInput => ({
  id,
  type: "VOCAB_CARD",
  vocab_item_id: `v-${id}`,
  content: { term, meaning, example: `Example for ${term}.` },
});

const mcq = (id: string): ExerciseInput => ({
  id,
  type: "MCQ",
  vocab_item_id: null,
  content: {
    prompt: "She ___ to school.",
    options: ["go", "goes", "going"],
    answerIndex: 1,
  },
});

const fill = (id: string): ExerciseInput => ({
  id,
  type: "FILL_BLANK",
  vocab_item_id: null,
  content: { prompt: "My name ___ Minh.", answer: "is", hint: "to be" },
});

const match = (id: string): ExerciseInput => ({
  id,
  type: "MATCHING",
  vocab_item_id: null,
  content: {
    instructions: "Nối từ",
    pairs: [
      { left: "greet", right: "chào hỏi" },
      { left: "polite", right: "lịch sự" },
    ],
  },
});

const meanings = ["chào hỏi", "lịch sự", "trang trọng", "người quen", "thân mật"];

describe("buildRound", () => {
  it("caps the round at ROUND_SIZE", () => {
    const exercises = Array.from({ length: 20 }, (_, i) =>
      vocabCard(`e${i}`, `term${i}`, meanings[i % meanings.length]),
    );
    const round = buildRound(exercises, {
      masteredIds: new Set(),
      vocabMeanings: meanings,
      seed: 7,
    });
    expect(round).toHaveLength(ROUND_SIZE);
  });

  it("puts not-yet-mastered exercises before mastered ones", () => {
    const exercises = [
      vocabCard("done1", "a", "chào hỏi"),
      vocabCard("done2", "b", "lịch sự"),
      vocabCard("todo1", "c", "trang trọng"),
    ];
    const round = buildRound(exercises, {
      masteredIds: new Set(["done1", "done2"]),
      vocabMeanings: meanings,
      seed: 3,
      size: 3,
    });
    expect(round[0].id).toBe("todo1");
  });

  it("is deterministic for a given seed", () => {
    const exercises = [mcq("a"), fill("b"), match("c"), vocabCard("d", "x", "lịch sự")];
    const opts = { masteredIds: new Set<string>(), vocabMeanings: meanings, seed: 42 };
    expect(buildRound(exercises, opts).map((q) => q.id)).toEqual(
      buildRound(exercises, opts).map((q) => q.id),
    );
  });

  it("turns a vocab card into a real multiple choice with distractors", () => {
    const round = buildRound([vocabCard("v1", "greet", "chào hỏi")], {
      masteredIds: new Set(),
      vocabMeanings: meanings,
      seed: 1,
    });
    const q = round[0];
    expect(q.kind).toBe("CHOICE");
    if (q.kind !== "CHOICE") return;

    expect(q.prompt).toBe("greet");
    expect(q.options).toHaveLength(4);
    expect(q.options[q.answerIndex]).toBe("chào hỏi");
    // Distractors must be other real meanings, never repeats of the answer.
    expect(new Set(q.options).size).toBe(4);
  });

  it("still builds a vocab question when the topic has too few distractors", () => {
    const round = buildRound([vocabCard("v1", "greet", "chào hỏi")], {
      masteredIds: new Set(),
      vocabMeanings: ["chào hỏi"],
      seed: 1,
    });
    const q = round[0];
    expect(q.kind).toBe("CHOICE");
    if (q.kind !== "CHOICE") return;
    expect(q.options).toEqual(["chào hỏi"]);
    expect(q.answerIndex).toBe(0);
  });

  it("maps each exercise type to the right question kind", () => {
    const round = buildRound([mcq("a"), fill("b"), match("c")], {
      masteredIds: new Set(),
      vocabMeanings: meanings,
      seed: 5,
    });
    const byId = new Map(round.map((q) => [q.id, q.kind]));
    expect(byId.get("a")).toBe("CHOICE");
    expect(byId.get("b")).toBe("INPUT");
    expect(byId.get("c")).toBe("MATCH");
  });

  it("drops malformed exercises instead of rendering a broken question", () => {
    const broken: ExerciseInput[] = [
      { id: "x", type: "MCQ", vocab_item_id: null, content: { prompt: "?", options: [] } },
      { id: "y", type: "FILL_BLANK", vocab_item_id: null, content: { prompt: "?" } },
      { id: "z", type: "VOCAB_CARD", vocab_item_id: null, content: {} },
    ];
    expect(
      buildRound(broken, { masteredIds: new Set(), vocabMeanings: meanings, seed: 1 }),
    ).toEqual([]);
  });

  it("returns an empty round for a topic with no exercises", () => {
    expect(
      buildRound([], { masteredIds: new Set(), vocabMeanings: [], seed: 1 }),
    ).toEqual([]);
  });
});

describe("generateShuffledSession", () => {
  it("prevents consecutive identical exercise formats", () => {
    const exercises = [
      { id: "1", type: "MCQ", skill: "VOCAB" },
      { id: "2", type: "MCQ", skill: "VOCAB" },
      { id: "3", type: "FILL_BLANK", skill: "GRAMMAR" },
      { id: "4", type: "MATCHING", skill: "READING" },
    ];

    const session = generateShuffledSession(exercises, { seed: 42 });
    for (let i = 1; i < session.length; i++) {
      expect(session[i].type).not.toBe(session[i - 1].type);
    }
  });

  it("prioritizes biased skill when provided", () => {
    const exercises = [
      { id: "1", type: "MCQ", skill: "VOCAB" },
      { id: "2", type: "FILL_BLANK", skill: "READING" },
      { id: "3", type: "MATCHING", skill: "READING" },
    ];

    const session = generateShuffledSession(exercises, { biasSkill: "READING", seed: 10 });
    expect(session[0].skill).toBe("READING");
  });
});

describe("isAnswerCorrect", () => {
  const choice: Question = {
    id: "c",
    kind: "CHOICE",
    exerciseType: "MCQ",
    instruction: "",
    prompt: "",
    options: ["go", "goes"],
    answerIndex: 1,
  };

  const input: Question = {
    id: "i",
    kind: "INPUT",
    exerciseType: "FILL_BLANK",
    instruction: "",
    prompt: "",
    answer: "is",
  };

  const matching: Question = {
    id: "m",
    kind: "MATCH",
    exerciseType: "MATCHING",
    instruction: "",
    pairs: [
      { left: "greet", right: "chào hỏi" },
      { left: "polite", right: "lịch sự" },
    ],
  };

  it("checks a choice by index", () => {
    expect(isAnswerCorrect(choice, 1)).toBe(true);
    expect(isAnswerCorrect(choice, 0)).toBe(false);
  });

  it("forgives case and surrounding space on typed answers", () => {
    expect(isAnswerCorrect(input, "  IS ")).toBe(true);
    expect(isAnswerCorrect(input, "Is")).toBe(true);
  });

  it("does not forgive a genuinely wrong typed answer", () => {
    expect(isAnswerCorrect(input, "are")).toBe(false);
    expect(isAnswerCorrect(input, "")).toBe(false);
  });

  it("requires every pair to match", () => {
    expect(
      isAnswerCorrect(matching, { greet: "chào hỏi", polite: "lịch sự" }),
    ).toBe(true);
    expect(
      isAnswerCorrect(matching, { greet: "lịch sự", polite: "chào hỏi" }),
    ).toBe(false);
    expect(isAnswerCorrect(matching, { greet: "chào hỏi" })).toBe(false);
  });
});
