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
}

// Only run automatically when invoked directly, so seed.ts can import it.
if (process.argv[1]?.includes("recompute")) {
  recomputeAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
