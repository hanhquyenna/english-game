"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Browser client. Used for realtime subscriptions and client-side reads.
 * A single module-level instance keeps one websocket for the whole tab.
 */
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 20 } },
  },
);
