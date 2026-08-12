"use client";

import { useState } from "react";

/**
 * The design's dismissible streak warning. It only renders when the student
 * genuinely has a live streak and has not practised today — the page decides
 * that from real `xp_events`, so this never cries wolf.
 */
export function StreakNotice({ streak }: { streak: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-[#ffe0a3] bg-[#fff8e8] px-3.5 py-2.5">
      <p className="flex-1 text-[13px] leading-snug text-[#7a5a12]">
        ⏰ You&rsquo;ll lose your {streak}-day streak tonight — finish a quick
        review!
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded px-1 text-[#b08a3a] hover:text-[#7a5a12]"
      >
        ✕
      </button>
    </div>
  );
}
