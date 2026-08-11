"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Keeps a server-rendered page live.
 *
 * Pages fetch their data in Server Components; this subscribes to the Postgres
 * changes that could invalidate them and calls router.refresh(), which re-runs
 * the server render and streams new markup into the existing page. No polling,
 * no manual refresh, and no duplicated fetching logic on the client.
 *
 * Bursts are coalesced: a practice round fires several writes in quick
 * succession, and one refresh at the end of the burst is enough.
 */
export function useRealtimeRefresh(
  tables: string[],
  options: { debounceMs?: number; onChange?: (table: string) => void } = {},
) {
  const router = useRouter();
  const { debounceMs = 250, onChange } = options;

  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // A stable key so re-renders with a fresh array literal don't resubscribe.
  const key = tables.join(",");

  useEffect(() => {
    const list = key.split(",").filter(Boolean);
    if (list.length === 0) return;

    const channel = supabase.channel(`beeblast:${key}:${crypto.randomUUID()}`);

    for (const table of list) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          onChangeRef.current?.(table);
          setLastEventAt(Date.now());
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => router.refresh(), debounceMs);
        },
      );
    }

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [key, debounceMs, router]);

  return { lastEventAt };
}

/**
 * A small "cập nhật vừa xong" pulse so a viewer can tell the page moved on its
 * own rather than wondering whether they missed something.
 */
export function useLiveIndicator(lastEventAt: number | null, ms = 2200) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!lastEventAt) return;
    setLive(true);
    const t = setTimeout(() => setLive(false), ms);
    return () => clearTimeout(t);
  }, [lastEventAt, ms]);

  return live;
}
