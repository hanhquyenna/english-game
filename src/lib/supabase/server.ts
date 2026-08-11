import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Server client for Server Components and Server Actions.
 *
 * The demo has no auth (§1: role picker, not real login), so there is no
 * session to carry and no cookie handling to do — a fresh stateless client
 * per call is correct and avoids sharing state across requests.
 */
export function createServerSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
