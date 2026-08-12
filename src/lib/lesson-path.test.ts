import { describe, expect, it } from "vitest";
import { buildLessonPath, UNLOCK_THRESHOLD } from "./lesson-path";

const topic = (
  id: string,
  title: string,
  assigned: boolean,
  percentComplete: number,
) => ({
  id,
  title,
  assigned_at: assigned ? "2026-08-01T00:00:00Z" : null,
  percentComplete,
});

describe("buildLessonPath", () => {
  it("leaves unassigned units off the path entirely", () => {
    const path = buildLessonPath([
      topic("1", "Unit 1", true, 100),
      topic("2", "Unit 2", true, 40),
      topic("3", "Unit 3", false, 0),
    ]);
    expect(path).toHaveLength(2);
    expect(path.map((n) => n.topic.id)).toEqual(["1", "2"]);
  });

  it("always unlocks the first assigned unit", () => {
    const path = buildLessonPath([topic("1", "Unit 1", true, 0)]);
    expect(path[0].state).toBe("AVAILABLE");
    expect(path[0].lockedReason).toBeNull();
  });

  it("locks a unit until the previous one reaches the threshold", () => {
    const path = buildLessonPath([
      topic("1", "Unit 1", true, UNLOCK_THRESHOLD - 1),
      topic("2", "Unit 2", true, 0),
    ]);
    expect(path[1].state).toBe("LOCKED");
    expect(path[1].lockedReason).toContain("Unit 1");
  });

  it("unlocks exactly at the threshold, not above it", () => {
    const path = buildLessonPath([
      topic("1", "Unit 1", true, UNLOCK_THRESHOLD),
      topic("2", "Unit 2", true, 0),
    ]);
    expect(path[1].state).toBe("AVAILABLE");
  });

  it("reproduces the demo's starting state", () => {
    // Minh: Unit 1 complete, Unit 2 at 40%, Unit 3 built but not yet assigned.
    const before = buildLessonPath([
      topic("1", "Unit 1: Greetings", true, 100),
      topic("2", "Unit 2: Family", true, 40),
      topic("3", "Unit 3: Daily Routine", false, 0),
    ]);
    expect(before.map((n) => n.state)).toEqual(["COMPLETED", "IN_PROGRESS"]);

    // ...and after the teacher assigns Unit 3 live, it appears and is playable,
    // because Unit 2 is exactly at the threshold.
    const after = buildLessonPath([
      topic("1", "Unit 1: Greetings", true, 100),
      topic("2", "Unit 2: Family", true, 40),
      topic("3", "Unit 3: Daily Routine", true, 0),
    ]);
    expect(after).toHaveLength(3);
    expect(after[2].state).toBe("AVAILABLE");
  });

  it("marks a fully finished unit as completed", () => {
    const path = buildLessonPath([topic("1", "Unit 1", true, 100)]);
    expect(path[0].state).toBe("COMPLETED");
  });

  it("returns an empty path when nothing is assigned yet", () => {
    expect(buildLessonPath([topic("1", "Unit 1", false, 0)])).toEqual([]);
  });
});
