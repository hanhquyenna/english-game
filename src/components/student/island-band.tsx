import Link from "next/link";
import { StudentAvatar } from "@/components/student-avatar";
import type { Island } from "@/lib/islands";
import type { PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

/**
 * One island on the Learn path: a titled scenery band, then its six level nodes
 * and an exam node laid out in a winding line, exactly as the design lays it
 * out. Locked nodes stay visible and inert; the active one carries the
 * student's own character as the "You are here" marker.
 */
export function IslandBand({
  studentId,
  island,
  theme,
  index,
  here,
  seed,
  overrides,
}: {
  studentId: string;
  island: Island;
  theme: { bandBg: string; iconBg: string; ground: string };
  index: number;
  here: { topicId: string; level: number } | null;
  seed: string;
  overrides: Partial<PeepConfig>;
}) {
  return (
    <section>
      <header
        className="relative flex items-center gap-3 overflow-hidden px-5 py-4"
        style={{ background: theme.bandBg }}
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-black text-white"
          style={{ background: theme.iconBg }}
          aria-hidden
        >
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] font-extrabold text-[#2a2540]">
            {island.name}
          </span>
          <span className="block truncate text-xs text-[#6b6390]">
            {island.subtitle ||
              `${island.doneThrough}/6 levels · ${island.percentComplete}% complete`}
          </span>
        </span>
        <span
          className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 font-display text-xs font-extrabold"
          style={{ color: theme.iconBg }}
        >
          {island.doneThrough}/6
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-3.5"
          style={{ background: `linear-gradient(180deg,transparent,${theme.ground})` }}
        />
      </header>

      {!island.unlocked ? (
        <p className="px-5 py-4 text-center text-sm text-[#a29c8f]">
          🔒 {island.lockedReason}
        </p>
      ) : (
        <ol className="px-5 py-3">
          {island.nodes.map((node, i) => {
            const isHere =
              here?.topicId === island.topicId && here.level === node.level;
            // Winding offset, matching the prototype's sin() stagger.
            const offset = Math.round(Math.sin((index * 7 + i) * 0.85) * 58);
            const locked = node.status === "locked";

            const body = (
              <span
                className={cn(
                  "grid place-items-center rounded-full font-display font-black transition-transform",
                  node.isExam && "rounded-2xl",
                  !locked && "hover:-translate-y-0.5",
                )}
                style={{
                  width: node.isExam ? 76 : node.status === "active" ? 70 : 58,
                  height: node.isExam ? 76 : node.status === "active" ? 70 : 58,
                  background:
                    node.status === "done"
                      ? "#e7e2fb"
                      : node.status === "active"
                        ? "#534ab7"
                        : "#f1efee",
                  border: `${node.status === "active" ? 4 : 3}px solid ${
                    node.status === "done"
                      ? "#d3caf7"
                      : node.status === "active"
                        ? "#423a94"
                        : "#e2dfdd"
                  }`,
                  color: locked
                    ? "#a29c8f"
                    : node.status === "active"
                      ? "#ffd54a"
                      : "#534ab7",
                  boxShadow:
                    node.status === "active"
                      ? "0 8px 18px -6px rgba(83,74,183,.6)"
                      : undefined,
                }}
              >
                <span className="text-xl" aria-hidden>
                  {locked
                    ? "🔒"
                    : node.isExam
                      ? "🏆"
                      : node.status === "done"
                        ? "✓"
                        : "★"}
                </span>
              </span>
            );

            return (
              <li
                key={node.label}
                className="flex items-center justify-center py-1.5"
                style={{ transform: `translateX(${offset}px)` }}
              >
                <span className="flex flex-col items-center">
                  {locked ? (
                    <span aria-disabled title="Locked">
                      {body}
                    </span>
                  ) : (
                    <Link
                      href={
                        node.isExam
                          ? `/student/${studentId}/challenges`
                          : `/student/${studentId}/practice/${island.topicId}?level=${node.level}`
                      }
                      aria-label={`${island.name} — ${node.label}`}
                    >
                      {body}
                    </Link>
                  )}
                  <span
                    className="mt-1.5 font-display text-[11.5px] font-extrabold"
                    style={{ color: locked ? "#c7c3c0" : "#6b6390" }}
                  >
                    {node.label}
                  </span>
                </span>

                {isHere ? (
                  <span className="ml-3 flex flex-col items-center">
                    {/* The prototype crops the top of the full-body figure
                        here (object-fit:cover; object-position:top), which is
                        the head-and-shoulders view — and it reads far better
                        at this size, since Open Peeps fills white garment
                        areas with the skin tone and a small standing figure
                        ends up looking bare-chested. */}
                    <StudentAvatar
                      seed={seed}
                      overrides={overrides}
                      size={46}
                      ring="#534ab7"
                      ringWidth={2}
                    />
                    <span className="mt-0.5 whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 font-display text-[9.5px] font-extrabold text-[#534ab7] shadow-sm">
                      You are here
                    </span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
