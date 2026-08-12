"use client";

import Link from "next/link";

/**
 * The design's pill tab row, used on Challenges, Rank and the Shop.
 *
 * Tabs are links carrying a query param rather than client state, so a tab is
 * addressable, survives a realtime refresh, and works with the back button.
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
    <div className="flex gap-2 px-4 py-3">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={`${basePath}?${param}=${t.key}`}
            aria-current={on ? "page" : undefined}
            scroll={false}
            className="rounded-full border border-[#ece8fb] px-3.5 py-1.5 text-[13px] font-bold transition-colors"
            style={{
              background: on ? "#534ab7" : "#fff",
              color: on ? "#fff" : "#8b83c4",
              borderColor: on ? "#534ab7" : "#ece8fb",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
