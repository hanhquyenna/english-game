"use client";

import Link from "next/link";
import { Mono } from "@/components/student/ui";

/**
 * `styles.segmented` / `styles.segment` — two equal-width 38px tall segments
 * with 2px borders and a 7px gap, filled with the primary colour when active.
 *
 * Implemented as links carrying a query param so a tab is addressable and
 * survives the realtime refresh.
 */
export function Segmented({
  tabs,
  active,
  basePath,
  param = "tab",
}: {
  tabs: { key: string; label: string }[];
  active: string;
  basePath: string;
  param?: string;
}) {
  return (
    <div className="mb-4 flex gap-[7px]">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={`${basePath}?${param}=${t.key}`}
            aria-current={on ? "page" : undefined}
            scroll={false}
            className="flex min-h-[38px] flex-1 items-center justify-center rounded-[2px] border-2 border-st-fg transition-opacity active:opacity-70"
            style={{
              backgroundColor: on ? "var(--st-primary)" : "var(--st-card)",
            }}
          >
            <Mono
              className="font-extrabold"
              style={{
                color: on ? "var(--st-primary-fg)" : "var(--st-muted-fg)",
              }}
            >
              {t.label}
            </Mono>
          </Link>
        );
      })}
    </div>
  );
}
