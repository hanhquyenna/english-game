"use client";

import { usePathname } from "next/navigation";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { EquippedItem, PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

export function StudentShell({
  studentId,
  children,
}: {
  studentId: string;
  seed: string;
  overrides: Partial<PeepConfig>;
  items: EquippedItem[];
  streak: number;
  gems: number;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const base = `/student/${studentId}`;
  const pathname = usePathname();

  useRealtimeRefresh([
    "topics",
    "level_scores",
    "notifications",
    "class_posts",
    "exams",
    "messages",
  ]);

  const isGameHome = pathname === base || pathname === `${base}/`;

  return (
    <div
      data-persona="student"
      className={cn(
        "flex flex-1 flex-col bg-st-bg text-st-fg min-h-screen",
        isGameHome ? "w-full" : "w-full max-w-6xl mx-auto px-4 md:px-8 py-4"
      )}
    >
      <main className="flex-1">{children}</main>
    </div>
  );
}
