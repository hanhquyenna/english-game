import { describe, expect, it } from "vitest";
import {
  buildIslands,
  currentPosition,
  LEVELS_PER_ISLAND,
  levelsDone,
  sliceForLevel,
  type TopicForIsland,
} from "./islands";

const topic = (
  id: string,
  title: string,
  percentComplete: number,
  assigned = true,
  hasExam = true,
): TopicForIsland => ({
  id,
  title,
  subtitle: `${title} subtitle`,
  assigned_at: assigned ? "2026-08-01T00:00:00Z" : null,
  percentComplete,
  hasExam,
});

describe("levelsDone", () => {
  it("maps a percentage onto whole levels (8 levels per island)", () => {
    expect(levelsDone(0)).toBe(0);
    expect(levelsDone(12)).toBe(0);
    expect(levelsDone(13)).toBe(1);
    expect(levelsDone(17)).toBe(1);
    expect(levelsDone(50)).toBe(4);
    expect(levelsDone(100)).toBe(LEVELS_PER_ISLAND);
  });

  it("clamps nonsense input instead of producing stray nodes", () => {
    expect(levelsDone(-40)).toBe(0);
    expect(levelsDone(400)).toBe(LEVELS_PER_ISLAND);
  });
});

describe("sliceForLevel", () => {
  const exercises = Array.from({ length: 14 }, (_, i) => `e${i + 1}`);

  it("gives every level a slice and covers all exercises", () => {
    const seen = new Set<string>();
    for (let lvl = 1; lvl <= LEVELS_PER_ISLAND; lvl++) {
      for (const e of sliceForLevel(exercises, lvl)) seen.add(e);
    }
    expect(seen.size).toBe(exercises.length);
  });

  it("is stable — the same level always means the same questions", () => {
    expect(sliceForLevel(exercises, 2)).toEqual(sliceForLevel(exercises, 2));
    expect(sliceForLevel(exercises, 1)).not.toEqual(sliceForLevel(exercises, 2));
  });

  it("copes with a topic that has fewer exercises than levels", () => {
    const few = ["a", "b"];
    expect(sliceForLevel(few, 1)).toEqual(["a"]);
    expect(sliceForLevel(few, 2)).toEqual(["b"]);
    expect(sliceForLevel(few, 5)).toEqual([]);
  });

  it("returns nothing for an empty topic", () => {
    expect(sliceForLevel([], 1)).toEqual([]);
  });

  it("handles various exercise counts without overlapping or out of bound slices", () => {
    for (const count of [3, 7, 8, 20]) {
      const items = Array.from({ length: count }, (_, i) => `q${i + 1}`);
      const seen = new Set<string>();
      for (let lvl = 1; lvl <= LEVELS_PER_ISLAND; lvl++) {
        const slice = sliceForLevel(items, lvl);
        for (const item of slice) {
          expect(seen.has(item)).toBe(false);
          seen.add(item);
        }
      }
      expect(seen.size).toBe(count);
    }
  });
});

describe("buildIslands", () => {
  it("leaves unassigned topics off the path", () => {
    const islands = buildIslands([
      topic("1", "Unit 1", 100),
      topic("2", "Unit 2", 43),
      topic("3", "Unit 3", 0, false),
    ]);
    expect(islands.map((i) => i.topicId)).toEqual(["1", "2"]);
  });

  it("gives each island eight levels plus an exam", () => {
    const [island] = buildIslands([topic("1", "Unit 1", 0)]);
    expect(island.nodes).toHaveLength(LEVELS_PER_ISLAND + 1);
    expect(island.nodes.at(-1)).toMatchObject({ isExam: true, label: "Exam" });
  });

  it("marks levels done, one active, and the rest locked", () => {
    // 43% of eight levels = 3 done, so level 4 is where the student is.
    const [island] = buildIslands([topic("1", "Unit 1", 43)]);
    expect(island.doneThrough).toBe(3);
    expect(island.activeLevel).toBe(4);
    expect(island.nodes.slice(0, 3).every((n) => n.status === "done")).toBe(true);
    expect(island.nodes[3].status).toBe("active");
    expect(island.nodes.slice(4, 8).every((n) => n.status === "locked")).toBe(true);
  });

  it("keeps the exam locked until every level is cleared", () => {
    const [partial] = buildIslands([topic("1", "Unit 1", 87)]);
    expect(partial.nodes.at(-1)!.status).toBe("locked");

    const [complete] = buildIslands([topic("1", "Unit 1", 100)]);
    expect(complete.nodes.at(-1)!.status).toBe("active");
  });

  it("keeps the exam locked when the topic has no exam to sit", () => {
    const [island] = buildIslands([topic("1", "Unit 1", 100, true, false)]);
    expect(island.nodes.at(-1)!.status).toBe("locked");
  });

  it("locks a whole island until the previous one passes the threshold", () => {
    const islands = buildIslands([
      topic("1", "Unit 1", 20),
      topic("2", "Unit 2", 0),
    ]);
    expect(islands[1].unlocked).toBe(false);
    expect(islands[1].activeLevel).toBe(-1);
    expect(islands[1].nodes.every((n) => n.status === "locked")).toBe(true);
    expect(islands[1].lockedReason).toContain("Unit 1");
  });

  it("reproduces the demo's starting state for Minh", () => {
    // Unit 1 complete, Unit 2 at 43%, Unit 3 assigned live during the demo.
    const islands = buildIslands([
      topic("1", "Unit 1: Greetings", 100),
      topic("2", "Unit 2: Family", 43),
      topic("3", "Unit 3: Daily Routine", 0),
    ]);
    expect(islands[0].doneThrough).toBe(8);
    expect(islands[1].activeLevel).toBe(4);
    expect(islands[2].unlocked).toBe(true); // 43% clears the 40% gate
    expect(islands[2].activeLevel).toBe(1);
  });

  it("numbers lessons continuously across multiple islands", () => {
    const islands = buildIslands([
      topic("1", "Unit 1", 100),
      topic("2", "Unit 2", 50),
    ]);
    expect(islands[0].nodes[0].label).toBe("Lesson 1");
    expect(islands[0].nodes[7].label).toBe("Lesson 8");
    expect(islands[0].nodes[8].label).toBe("Exam");
    expect(islands[1].nodes[0].label).toBe("Lesson 9");
    expect(islands[1].nodes[7].label).toBe("Lesson 16");
    expect(islands[1].nodes[8].label).toBe("Exam");
  });
});

describe("currentPosition", () => {
  it("points at the first island with an active level", () => {
    const islands = buildIslands([
      topic("1", "Unit 1", 100),
      topic("2", "Unit 2", 43),
    ]);
    expect(currentPosition(islands)).toEqual({ topicId: "2", level: 4 });
  });

  it("is null when everything assigned is finished", () => {
    expect(currentPosition(buildIslands([topic("1", "Unit 1", 100)]))).toBeNull();
  });
});
