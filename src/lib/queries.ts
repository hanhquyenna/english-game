import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { breakdownFromRow, type LevelBreakdown } from "@/lib/level-engine";
import { computeStreak, isoDate, streakState, type StreakState } from "@/lib/progression";
import { ITEM_COLORS, type EquippedItem, type PeepConfig } from "@/lib/peeps";
import { buildIslands, type Island } from "@/lib/islands";
import {
  toMapNodes,
  nodeIndexFor,
  trackGrid,
  DEFAULT_LANDMARKS,
  type ClassMapData,
  type VillageMapData,
  type MapMate,
  type MapNode,
  type MapTrack,
  type MapLandmark,
  type TrackKind,
} from "@/lib/class-map";
import type { Tables } from "@/lib/database.types";

export type StudentSummary = {
  id: string;
  name: string;
  level: LevelBreakdown | null;
  streak: number;
  streakState: StreakState;
  totalXp: number;
  /** Everything <StudentAvatar/> needs — one identity across every screen. */
  avatarSeed: string;
  frameColor: string | null;
  items: EquippedItem[];
  overrides: Partial<PeepConfig>;
  gems: number;
  unreadCount?: number;
};

export async function getUsers() {
  const db = createServerSupabase();
  const { data } = await db.from("users").select("*").order("role");
  return data ?? [];
}

export async function getUser(id: string) {
  const db = createServerSupabase();
  const { data } = await db.from("users").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getClassForTeacher(teacherId: string) {
  const db = createServerSupabase();
  const { data } = await db
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return data;
}

export async function getClassForStudent(studentId: string) {
  const db = createServerSupabase();
  const { data } = await db
    .from("enrollments")
    .select("classes(*)")
    .eq("student_id", studentId)
    .maybeSingle();
  return data?.classes ?? null;
}

/** Latest LevelScore row per student, as a map. One query, not N. */
export async function getLatestLevels(studentIds: string[]) {
  const db = createServerSupabase();
  if (studentIds.length === 0) return new Map<string, LevelBreakdown>();

  const { data } = await db
    .from("level_scores")
    .select("*")
    .in("student_id", studentIds)
    .order("computed_at", { ascending: false });

  const map = new Map<string, LevelBreakdown>();
  for (const row of data ?? []) {
    // Rows arrive newest-first, so the first one seen per student wins.
    if (!map.has(row.student_id)) {
      map.set(row.student_id, breakdownFromRow(row));
    }
  }
  return map;
}

/** Practice dates (YYYY-MM-DD) per student, for streak maths. */
export async function getPracticeDates(studentIds: string[]) {
  const db = createServerSupabase();
  const map = new Map<string, string[]>();
  if (studentIds.length === 0) return map;

  const { data } = await db
    .from("xp_events")
    .select("student_id, date, xp")
    .in("student_id", studentIds)
    .gt("xp", 0)
    .order("date", { ascending: false });

  for (const row of data ?? []) {
    const list = map.get(row.student_id) ?? [];
    list.push(row.date);
    map.set(row.student_id, list);
  }
  return map;
}

export async function getTotalXp(studentIds: string[]) {
  const db = createServerSupabase();
  const map = new Map<string, number>();
  if (studentIds.length === 0) return map;

  const { data } = await db
    .from("xp_events")
    .select("student_id, xp")
    .in("student_id", studentIds);

  for (const row of data ?? []) {
    map.set(row.student_id, (map.get(row.student_id) ?? 0) + Number(row.xp));
  }
  return map;
}

export async function getAvatars(studentIds: string[]) {
  const db = createServerSupabase();
  const [{ data: studentAvatars }, { data: catalogue }] = await Promise.all([
    studentIds.length
      ? db.from("student_avatars").select("*").in("student_id", studentIds)
      : Promise.resolve({ data: [] as Tables<"student_avatars">[] }),
    db.from("avatars").select("*"),
  ]);

  const byId = new Map((catalogue ?? []).map((a) => [a.id, a]));
  const map = new Map<
    string,
    {
      seed: string;
      frameColor: string | null;
      items: EquippedItem[];
      overrides: Partial<PeepConfig>;
      gems: number;
    }
  >();

  for (const row of studentAvatars ?? []) {
    const equipped = Array.isArray(row.equipped_accessory_ids)
      ? (row.equipped_accessory_ids as string[])
      : [];

    map.set(row.student_id, {
      seed: row.base_avatar_seed,
      frameColor: row.current_rank_frame_id
        ? (byId.get(row.current_rank_frame_id)?.image_url ?? null)
        : null,
      items: equipped
        .map((id) => byId.get(id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
        .map((a) => ({
          icon: a.image_url,
          slot: (a.slot === "badge" ? "badge" : "hat") as EquippedItem["slot"],
          color: ITEM_COLORS[a.image_url],
          label: a.label,
        })),
      overrides: (row.peep_overrides ?? {}) as Partial<PeepConfig>,
      gems: Number(row.gems ?? 0),
    });
  }
  return map;
}

/** Everything the teacher's class dashboard needs, for every enrolled student. */
export async function getRoster(classId: string): Promise<StudentSummary[]> {
  const db = createServerSupabase();
  const { data: enrolled } = await db
    .from("enrollments")
    .select("student_id, users(id, name)")
    .eq("class_id", classId);

  const students = (enrolled ?? [])
    .map((e) => e.users)
    .filter((u): u is { id: string; name: string } => Boolean(u));

  const ids = students.map((s) => s.id);
  const [levels, practice, xp, avatars] = await Promise.all([
    getLatestLevels(ids),
    getPracticeDates(ids),
    getTotalXp(ids),
    getAvatars(ids),
  ]);

  const today = isoDate();

  return students
    .map((s) => {
      const dates = practice.get(s.id) ?? [];
      const avatar = avatars.get(s.id);
      return {
        id: s.id,
        name: s.name,
        level: levels.get(s.id) ?? null,
        streak: computeStreak(dates, today),
        streakState: streakState(dates, today),
        totalXp: xp.get(s.id) ?? 0,
        avatarSeed: avatar?.seed ?? s.id,
        frameColor: avatar?.frameColor ?? null,
        items: avatar?.items ?? [],
        overrides: avatar?.overrides ?? {},
        gems: avatar?.gems ?? 0,
        unreadCount: 0,
      };
    })
    .sort((a, b) => (b.level?.compositeScore ?? 0) - (a.level?.compositeScore ?? 0));
}

export async function getStudentSummary(
  studentId: string,
): Promise<StudentSummary | null> {
  const user = await getUser(studentId);
  if (!user) return null;

  const db = createServerSupabase();
  const [levels, practice, xp, avatars, { count }] = await Promise.all([
    getLatestLevels([studentId]),
    getPracticeDates([studentId]),
    getTotalXp([studentId]),
    getAvatars([studentId]),
    db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", studentId)
      .eq("read", false),
  ]);

  const dates = practice.get(studentId) ?? [];
  const avatar = avatars.get(studentId);
  const today = isoDate();

  return {
    id: user.id,
    name: user.name,
    level: levels.get(studentId) ?? null,
    streak: computeStreak(dates, today),
    streakState: streakState(dates, today),
    totalXp: xp.get(studentId) ?? 0,
    avatarSeed: avatar?.seed ?? studentId,
    frameColor: avatar?.frameColor ?? null,
    items: avatar?.items ?? [],
    overrides: avatar?.overrides ?? {},
    gems: avatar?.gems ?? 0,
    unreadCount: count ?? 0,
  };
}

/** Topics for a class, with one student's progress folded in. */
export async function getTopicsWithProgress(classId: string, studentId?: string) {
  const db = createServerSupabase();
  const { data: topics } = await db
    .from("topics")
    .select("*")
    .eq("class_id", classId)
    .order("order");

  const list = topics ?? [];
  if (!studentId || list.length === 0) {
    return list.map((t) => ({ ...t, percentComplete: 0 }));
  }

  const { data: progress } = await db
    .from("topic_progress")
    .select("topic_id, percent_complete")
    .eq("student_id", studentId)
    .in(
      "topic_id",
      list.map((t) => t.id),
    );

  const byTopic = new Map(
    (progress ?? []).map((p) => [p.topic_id, Number(p.percent_complete)]),
  );

  return list.map((t) => ({ ...t, percentComplete: byTopic.get(t.id) ?? 0 }));
}

/**
 * Topics shaped for the Learn screen's island path — progress folded in and
 * a flag for whether the unit actually has an exam to sit.
 */
export async function getIslandTopics(classId: string, studentId: string) {
  const db = createServerSupabase();
  const topics = await getTopicsWithProgress(classId, studentId);

  const { data: exams } = await db
    .from("exams")
    .select("topic_id")
    .eq("class_id", classId)
    .not("published_at", "is", null);

  const withExam = new Set(
    (exams ?? []).map((e) => e.topic_id).filter((id): id is string => Boolean(id)),
  );

  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle,
    assigned_at: t.assigned_at,
    percentComplete: t.percentComplete,
    hasExam: withExam.has(t.id),
  }));
}

export async function getClassMapData(
  studentId: string
): Promise<ClassMapData | null> {
  return getVillageMapData(studentId);
}

export async function getVillageMapData(
  studentId: string
): Promise<VillageMapData | null> {
  const db = createServerSupabase();
  const [student, klass] = await Promise.all([
    getStudentSummary(studentId),
    getClassForStudent(studentId),
  ]);
  if (!student || !klass) return null;

  // 1. Learn track
  const learnTopics = await getIslandTopics(klass.id, studentId);
  const learnIslands = buildIslands(learnTopics);
  const currentLearnIsland =
    learnIslands.find((isl) => isl.percentComplete < 100) ??
    learnIslands[learnIslands.length - 1] ?? {
      topicId: "default-learn",
      name: "Unit 1",
      subtitle: "",
      percentComplete: 0,
      doneThrough: 0,
      activeLevel: 1,
      unlocked: true,
      lockedReason: null,
      nodes: [],
    };
  const learnNodes = toMapNodes(
    currentLearnIsland,
    "learn",
    currentLearnIsland.name
  );

  // 2. Arena track (library topics)
  const { data: libraryTopicsRaw } = await db
    .from("topics")
    .select("*")
    .or("class_id.is.null,source.eq.library")
    .order("order");

  const arenaTopics = (libraryTopicsRaw ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle ?? null,
    assigned_at: new Date().toISOString(),
    percentComplete: 0,
    hasExam: false,
  }));

  if (arenaTopics.length === 0) {
    arenaTopics.push(
      {
        id: "arena-lib-1",
        title: "Travel & Airport Conversations",
        subtitle: "A1–B1 Spoken English Practice",
        assigned_at: new Date().toISOString(),
        percentComplete: 0,
        hasExam: false,
      },
      {
        id: "arena-lib-2",
        title: "Workplace & Email Etiquette",
        subtitle: "B1–B2 Business English",
        assigned_at: new Date().toISOString(),
        percentComplete: 0,
        hasExam: false,
      }
    );
  }

  const arenaIslands = buildIslands(arenaTopics);
  const currentArenaIsland = arenaIslands[0];
  const arenaNodes = toMapNodes(
    currentArenaIsland,
    "arena",
    currentArenaIsland.name
  );

  const arenaUnlocked = student.streak > 0 || student.totalXp >= 100;
  const arenaLockedReason = arenaUnlocked
    ? null
    : "Luyện tập 1 hôm hoặc đạt 100 XP để mở Đấu trường";

  // 3. Classmates
  const { data: enrolled } = await db
    .from("enrollments")
    .select("student_id, users(id, name)")
    .eq("class_id", klass.id);

  const classmates = (enrolled ?? [])
    .map((e) => e.users)
    .filter((u): u is { id: string; name: string } => Boolean(u));

  const studentIds = classmates.map((c) => c.id);

  const [learnProgressRes, arenaProgressRes, avatarsMap] = await Promise.all([
    studentIds.length
      ? db
          .from("topic_progress")
          .select("student_id, percent_complete")
          .eq("topic_id", currentLearnIsland.topicId)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? db
          .from("topic_progress")
          .select("student_id, percent_complete")
          .eq("topic_id", currentArenaIsland.topicId)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
    getAvatars(studentIds),
  ]);

  const learnProgress = new Map(
    (learnProgressRes.data ?? []).map((p) => [
      p.student_id,
      Number(p.percent_complete ?? 0),
    ])
  );
  const arenaProgress = new Map(
    (arenaProgressRes.data ?? []).map((p) => [
      p.student_id,
      Number(p.percent_complete ?? 0),
    ])
  );

  const mates: MapMate[] = classmates.map((c) => {
    const lp = learnProgress.get(c.id) ?? 0;
    const ap = arenaProgress.get(c.id) ?? 0;
    const isArena = ap > lp;
    const track: TrackKind = isArena ? "arena" : "learn";
    const percent = isArena ? ap : lp;
    const nodeIndex = nodeIndexFor(percent, 9);
    const av = avatarsMap.get(c.id);

    return {
      studentId: c.id,
      name: c.name,
      track,
      nodeIndex,
      seed: av?.seed ?? c.id,
      overrides: (av?.overrides ?? {}) as Record<string, unknown>,
      items: (av?.items ?? []) as MapMate["items"],
      isMe: c.id === studentId,
    };
  });

  const meMate = mates.find((m) => m.studentId === studentId);
  const myLearnPct = learnProgress.get(studentId) ?? 0;
  const myNodeIdx = nodeIndexFor(myLearnPct, 9);

  const maxLearnReached =
    mates.filter((m) => m.track === "learn").length > 0
      ? Math.max(
          ...mates.filter((m) => m.track === "learn").map((m) => m.nodeIndex)
        )
      : 0;
  const classUnlocked = Math.min(9, Math.max(1, maxLearnReached + 1));

  const landmarks = DEFAULT_LANDMARKS.map((lm) => ({
    ...lm,
    href: lm.href ? lm.href.replace(":id", studentId) : undefined,
  }));

  return {
    className: klass.name,
    tracks: [
      { kind: "learn", label: "Đường Học", nodes: learnNodes },
      { kind: "arena", label: "Đường Đấu", nodes: arenaNodes },
    ],
    landmarks,
    mates,
    me: { track: "learn", nodeIndex: myNodeIdx },
    classUnlocked,
    totalNodes: 9,
    arenaUnlocked,
    arenaLockedReason,
  };
}

/** Counts of vocab / grammar / exercises per topic, for the curriculum list. */
export async function getTopicContentCounts(topicIds: string[]) {
  const db = createServerSupabase();
  const map = new Map(
    topicIds.map((id) => [id, { vocab: 0, grammar: 0, exercises: 0 }]),
  );
  if (topicIds.length === 0) return map;

  const [{ data: v }, { data: g }, { data: e }] = await Promise.all([
    db.from("vocab_items").select("topic_id").in("topic_id", topicIds),
    db.from("grammar_points").select("topic_id").in("topic_id", topicIds),
    db.from("exercises").select("topic_id").in("topic_id", topicIds),
  ]);

  for (const row of v ?? []) map.get(row.topic_id)!.vocab++;
  for (const row of g ?? []) map.get(row.topic_id)!.grammar++;
  for (const row of e ?? []) map.get(row.topic_id)!.exercises++;
  return map;
}

export async function getNotifications(userId: string, limit = 40) {
  const db = createServerSupabase();
  const { data } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getChildrenOfParent(parentId: string) {
  const db = createServerSupabase();
  const { data } = await db
    .from("parent_links")
    .select("student_id, users!parent_links_student_id_fkey(id, name)")
    .eq("parent_id", parentId);
  return (data ?? [])
    .map((r) => r.users)
    .filter((u): u is { id: string; name: string } => Boolean(u));
}

/** Composite-score history, for the parent's progress-over-time chart. */
export async function getLevelHistory(studentId: string, limit = 60) {
  const db = createServerSupabase();
  const { data } = await db
    .from("level_scores")
    .select("computed_at, composite_score, cefr_band")
    .eq("student_id", studentId)
    .order("computed_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}

/** Per-day XP for the parent's study calendar. */
export async function getXpCalendar(studentId: string) {
  const db = createServerSupabase();
  const { data } = await db
    .from("xp_events")
    .select("date, xp")
    .eq("student_id", studentId)
    .order("date", { ascending: true });
  return data ?? [];
}
