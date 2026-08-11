"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { computeStreak, isoDate, streakState } from "@/lib/progression";
import type { Json } from "@/lib/database.types";

/**
 * The daily streak check (§4).
 *
 * One implementation, two callers: a scheduled job hits it through
 * /api/cron/streak-check, and the demo's "chạy kiểm tra streak" button calls it
 * directly. The button does not fake anything — it runs this exact function on
 * demand instead of waiting for the clock, which is the point of having it.
 *
 * Notifications are de-duplicated per user per day, so running it repeatedly
 * (as a demo operator will) does not spam the feed.
 */
export async function runStreakCheck() {
  const db = createServerSupabase();
  const today = isoDate();

  const { data: students } = await db
    .from("users")
    .select("id, name")
    .eq("role", "STUDENT");

  if (!students?.length) return { atRisk: 0, broken: 0, checked: 0 };

  const ids = students.map((s) => s.id);

  const [{ data: xp }, { data: links }, { data: todaysNotifications }] =
    await Promise.all([
      db.from("xp_events").select("student_id, date, xp").in("student_id", ids).gt("xp", 0),
      db.from("parent_links").select("parent_id, student_id").in("student_id", ids),
      db
        .from("notifications")
        .select("user_id, type, payload, created_at")
        .in("type", ["STREAK_AT_RISK", "STREAK_BROKEN"])
        .gte("created_at", `${today}T00:00:00Z`),
    ]);

  const datesByStudent = new Map<string, string[]>();
  for (const row of xp ?? []) {
    const list = datesByStudent.get(row.student_id) ?? [];
    list.push(row.date);
    datesByStudent.set(row.student_id, list);
  }

  const parentsByStudent = new Map<string, string[]>();
  for (const l of links ?? []) {
    const list = parentsByStudent.get(l.student_id) ?? [];
    list.push(l.parent_id);
    parentsByStudent.set(l.student_id, list);
  }

  // Already-notified set, keyed by student so both the student's and the
  // parents' copies are suppressed together.
  const alreadyNotified = new Set(
    (todaysNotifications ?? []).map((n) => {
      const payload = (n.payload ?? {}) as { studentId?: string };
      return `${payload.studentId ?? ""}:${n.type}`;
    }),
  );

  const rows: Array<{
    user_id: string;
    type: "STREAK_AT_RISK" | "STREAK_BROKEN";
    payload: Json;
  }> = [];

  let atRisk = 0;
  let broken = 0;

  for (const student of students) {
    const dates = datesByStudent.get(student.id) ?? [];
    const state = streakState(dates, today);
    if (state === "ACTIVE_TODAY") continue;

    const streak = computeStreak(dates, today);
    const type = state === "AT_RISK" ? "STREAK_AT_RISK" : "STREAK_BROKEN";

    // Nothing to warn about for a student who has never built a streak.
    if (type === "STREAK_BROKEN" && dates.length === 0) continue;
    if (alreadyNotified.has(`${student.id}:${type}`)) continue;

    if (type === "STREAK_AT_RISK") atRisk++;
    else broken++;

    const payload = {
      studentId: student.id,
      studentName: student.name,
      streak,
    } as Json;

    for (const userId of [student.id, ...(parentsByStudent.get(student.id) ?? [])]) {
      rows.push({ user_id: userId, type, payload });
    }

    // A broken streak really does reset the counter.
    if (type === "STREAK_BROKEN") {
      await db
        .from("xp_events")
        .upsert(
          { student_id: student.id, date: today, xp: 0, streak_count: 0 },
          { onConflict: "student_id,date" },
        );
    }
  }

  if (rows.length) await db.from("notifications").insert(rows);

  revalidatePath("/", "layout");
  return { atRisk, broken, checked: students.length };
}
