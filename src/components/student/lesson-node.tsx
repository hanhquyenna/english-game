import Link from "next/link";
import type { PathNode } from "@/lib/lesson-path";
import { cn } from "@/lib/utils";

type Topic = { id: string; title: string; assigned_at: string | null };

const STATE_STYLE = {
  COMPLETED: {
    icon: "⭐",
    label: "Đã xong",
    ring: "var(--success)",
    tint: "bg-[var(--success)]/8",
  },
  IN_PROGRESS: {
    icon: "▶",
    label: "Đang học",
    ring: "var(--persona)",
    tint: "bg-[var(--persona-soft)]",
  },
  AVAILABLE: {
    icon: "✦",
    label: "Mở khoá",
    ring: "var(--persona)",
    tint: "bg-card",
  },
  LOCKED: {
    icon: "🔒",
    label: "Chưa mở",
    ring: "var(--muted-foreground)",
    tint: "bg-black/3",
  },
} as const;

/**
 * One stop on the winding lesson path. Locked nodes stay visible and say what
 * would unlock them — a node the student cannot act on is still information,
 * as long as it is honest about why.
 */
export function LessonNode({
  studentId,
  node,
  index,
  exerciseCount,
  isLast,
}: {
  studentId: string;
  node: PathNode<Topic>;
  index: number;
  exerciseCount: number;
  isLast: boolean;
}) {
  const style = STATE_STYLE[node.state];
  const locked = node.state === "LOCKED";
  // Gentle left/right stagger, so the path reads as a route rather than a list.
  const offset = index % 2 === 0 ? "sm:ml-0" : "sm:ml-12";

  const body = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 transition-transform",
        style.tint,
        !locked && "hover:-translate-y-0.5 hover:shadow-md",
      )}
      style={{ borderColor: locked ? undefined : "var(--persona-border)" }}
    >
      <span
        className="grid size-14 shrink-0 place-items-center rounded-full text-xl font-bold text-white shadow-inner"
        style={{ backgroundColor: style.ring }}
        aria-hidden
      >
        {style.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{node.topic.title}</span>
          <span className="rounded-full bg-black/6 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {style.label}
          </span>
        </span>

        {locked ? (
          <span className="mt-1 block text-sm text-muted-foreground">
            {node.lockedReason}
          </span>
        ) : (
          <>
            <span className="mt-1 block text-sm text-muted-foreground">
              {exerciseCount} bài tập · hoàn thành {node.percentComplete}%
            </span>
            <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-black/10">
              <span
                className="level-bar-fill block h-full rounded-full transition-[width] duration-700"
                style={{ width: `${Math.max(2, node.percentComplete)}%` }}
              />
            </span>
          </>
        )}
      </span>

      {!locked ? (
        <span
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--persona)" }}
        >
          {node.percentComplete > 0 ? "Học tiếp" : "Bắt đầu"}
        </span>
      ) : null}
    </div>
  );

  return (
    <li className={cn("relative", offset)}>
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-11 top-full h-4 w-0.5 -translate-x-1/2 bg-black/10"
        />
      ) : null}

      {locked ? (
        <div aria-disabled>{body}</div>
      ) : (
        <Link
          href={`/student/${studentId}/practice/${node.topic.id}`}
          className="block rounded-2xl outline-offset-2 focus-visible:outline-2"
        >
          {body}
        </Link>
      )}
    </li>
  );
}
