"use client";

import { useLiveIndicator, useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { cn } from "@/lib/utils";

/**
 * Subscribes the page to realtime and shows when something arrived.
 *
 * Sitting in the header means every screen in a persona is live, not just the
 * one dashboard that happens to be on camera during the demo.
 */
export function LiveBadge({
  tables,
  className,
}: {
  tables: string[];
  className?: string;
}) {
  const { lastEventAt } = useRealtimeRefresh(tables);
  const live = useLiveIndicator(lastEventAt);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        live ? "bg-white/25 text-white" : "bg-white/10 text-white/70",
        className,
      )}
      title="Dữ liệu tự cập nhật theo thời gian thực"
    >
      <span
        className={cn(
          "size-1.5 rounded-full bg-white",
          live ? "animate-pulse" : "opacity-60",
        )}
      />
      {live ? "Vừa cập nhật" : "Trực tiếp"}
    </span>
  );
}
