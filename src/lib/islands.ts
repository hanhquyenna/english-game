/**
 * The Learn screen's island path.
 *
 * The design draws each unit as an island holding six numbered levels plus an
 * exam node at the end. The backend has topics with a set of exercises and a
 * `topic_progress` percentage, so an island is a *view* of a topic: its
 * exercises are sliced into six levels, and how far the student has got decides
 * which nodes are done, which one is active, and which are still locked.
 *
 * Pure — no database, no React — so the unlock rules are unit-testable.
 */

import { UNLOCK_THRESHOLD } from "@/lib/lesson-path";

export const LEVELS_PER_ISLAND = 6;

export type NodeStatus = "done" | "active" | "locked";

export type IslandNode = {
  /** 1-6 for levels; null for the exam node. */
  level: number | null;
  label: string;
  status: NodeStatus;
  isExam: boolean;
};

export type Island = {
  topicId: string;
  name: string;
  subtitle: string;
  /** 0-100 for the whole unit. */
  percentComplete: number;
  doneThrough: number;
  activeLevel: number;
  unlocked: boolean;
  lockedReason: string | null;
  nodes: IslandNode[];
};

export type TopicForIsland = {
  id: string;
  title: string;
  subtitle: string | null;
  assigned_at: string | null;
  percentComplete: number;
  /** Whether this topic has a published exam the student can sit. */
  hasExam: boolean;
};

/** How many of the six levels a percentage covers. */
export function levelsDone(percentComplete: number): number {
  const clamped = Math.max(0, Math.min(100, percentComplete));
  return Math.floor((clamped / 100) * LEVELS_PER_ISLAND);
}

/**
 * Which exercises belong to a level. The topic's exercises are split into six
 * contiguous slices, so "Level 3" always means the same questions.
 */
export function sliceForLevel<T>(exercises: T[], level: number): T[] {
  if (exercises.length === 0) return [];
  const per = Math.ceil(exercises.length / LEVELS_PER_ISLAND);
  const start = (level - 1) * per;
  return exercises.slice(start, start + per);
}

export function buildIslands(topics: TopicForIsland[]): Island[] {
  const assigned = topics.filter((t) => t.assigned_at);
  let globalLessonCount = 0;

  return assigned.map((topic, i) => {
    const previous = i > 0 ? assigned[i - 1] : null;
    const unlocked =
      i === 0 || (previous?.percentComplete ?? 0) >= UNLOCK_THRESHOLD;

    const done = unlocked ? levelsDone(topic.percentComplete) : 0;
    const activeLevel = !unlocked
      ? -1
      : done >= LEVELS_PER_ISLAND
        ? -1
        : done + 1;

    const nodes: IslandNode[] = [];
    for (let lvl = 1; lvl <= LEVELS_PER_ISLAND; lvl++) {
      globalLessonCount++;
      nodes.push({
        level: lvl,
        label: `Lesson ${globalLessonCount}`,
        isExam: false,
        status: lvl <= done ? "done" : lvl === activeLevel ? "active" : "locked",
      });
    }

    // The exam only opens once every level on the island is cleared.
    nodes.push({
      level: null,
      label: "Exam",
      isExam: true,
      status:
        done >= LEVELS_PER_ISLAND && topic.hasExam ? "active" : "locked",
    });

    return {
      topicId: topic.id,
      name: topic.title,
      subtitle: topic.subtitle ?? "",
      percentComplete: topic.percentComplete,
      doneThrough: done,
      activeLevel,
      unlocked,
      lockedReason: unlocked
        ? null
        : `Reach ${UNLOCK_THRESHOLD}% of "${previous?.title ?? ""}" to unlock`,
      nodes,
    };
  });
}

/** The single node the "You are here" marker sits on, if any. */
export function currentPosition(
  islands: Island[],
): { topicId: string; level: number } | null {
  for (const island of islands) {
    if (island.activeLevel > 0) {
      return { topicId: island.topicId, level: island.activeLevel };
    }
  }
  return null;
}
