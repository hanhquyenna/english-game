/**
 * Recompute every student's LevelScore from whatever is currently in the
 * database. Used once after seeding, and useful on its own whenever the
 * weights in level-engine.ts are tuned.
 *
 *   npm run recompute
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "../src/lib/database.types";
import { recomputeLevel } from "../src/lib/level-service";
import { weakestInput } from "../src/lib/level-engine";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Missing Supabase env vars in .env.local");

export async function recomputeAll() {
  const db = createClient<Database>(url!, key!, {
    auth: { persistSession: false },
  });

  const { data: students, error } = await db
    .from("users")
    .select("id, name")
    .eq("role", "STUDENT")
    .order("name");

  if (error) throw new Error(error.message);

  for (const s of students ?? []) {
    const r = await recomputeLevel(db, s.id);
    const w = weakestInput(r);
    console.log(
      `  ${s.name.padEnd(6)} ${r.cefrBand}  composite ${String(r.compositeScore).padStart(5)}  ` +
        `(${r.progressToNextBand}% to ${r.nextBand ?? "—"})  weakest: ${w.key} ${w.score}`,
    );
    console.log(
      `         hours ${r.hoursScore}  vocab ${r.vocabScore}  exam ${r.examScore}  ` +
        `coverage ${r.coverageScore}  grammar ${r.grammarScore}`,
    );
  }

  // C4: Weekly League Group Partitioning
  console.log("\n--- Partitioning Weekly League Groups (C4) ---");
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekStartDate = monday.toISOString().slice(0, 10);

  // Group students by CEFR Band
  const bandMap = new Map<string, { id: string; name: string }[]>();
  for (const s of students ?? []) {
    const { data: score } = await db
      .from("level_scores")
      .select("cefr_band")
      .eq("student_id", s.id)
      .maybeSingle();

    const band = score?.cefr_band ?? "A1";
    if (!bandMap.has(band)) bandMap.set(band, []);
    bandMap.get(band)!.push(s);
  }

  for (const [band, bandStudents] of bandMap.entries()) {
    // Partition into groups of 30
    for (let i = 0; i < bandStudents.length; i += 30) {
      const chunk = bandStudents.slice(i, i + 30);
      const groupIndex = Math.floor(i / 30) + 1;

      // Upsert league group
      const { data: group } = await (db as any)
        .from("league_groups")
        .upsert(
          { week_start_date: weekStartDate, cefr_band: band, group_index: groupIndex },
          { onConflict: "week_start_date,cefr_band,group_index" },
        )
        .select("id")
        .single();

      if (group) {
        for (const st of chunk) {
          await (db as any).from("league_memberships").upsert(
            {
              league_group_id: group.id,
              student_id: st.id,
              xp_this_week: 0,
            },
            { onConflict: "league_group_id,student_id" },
          );
        }
      }
    }
  }
  console.log(`  Processed weekly league groups for week ${weekStartDate}.`);
}

// Only run automatically when invoked directly, so seed.ts can import it.
if (process.argv[1]?.includes("recompute")) {
  recomputeAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
