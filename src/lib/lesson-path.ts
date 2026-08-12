/**
 * Lesson-path unlocking (§6 student 1).
 *
 * Two gates, both real:
 *   1. the teacher must have assigned the unit — unassigned units are not on
 *      the student's path at all, which is what makes "the content is exactly
 *      what their teacher is teaching" true rather than a slogan;
 *   2. the previous assigned unit must have reached UNLOCK_THRESHOLD, so the
 *      path behaves like a skill tree instead of a flat list.
 */
export const UNLOCK_THRESHOLD = 40;

export type PathNodeState = "COMPLETED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";

export type PathNode<T> = {
  topic: T;
  state: PathNodeState;
  percentComplete: number;
  /** Why it is locked, in words a student can act on. */
  lockedReason: string | null;
};

export function buildLessonPath<
  T extends { id: string; title: string; assigned_at: string | null },
>(topics: Array<T & { percentComplete: number }>): PathNode<T>[] {
  const assigned = topics.filter((t) => t.assigned_at);

  return assigned.map((topic, i) => {
    const percentComplete = topic.percentComplete;
    const previous = i > 0 ? assigned[i - 1] : null;
    const unlocked =
      i === 0 || (previous?.percentComplete ?? 0) >= UNLOCK_THRESHOLD;

    let state: PathNodeState;
    if (!unlocked) state = "LOCKED";
    else if (percentComplete >= 100) state = "COMPLETED";
    else if (percentComplete > 0) state = "IN_PROGRESS";
    else state = "AVAILABLE";

    return {
      topic,
      state,
      percentComplete,
      lockedReason: unlocked
        ? null
        : `Hoàn thành ít nhất ${UNLOCK_THRESHOLD}% “${previous?.title ?? ""}” để mở khoá`,
    };
  });
}
