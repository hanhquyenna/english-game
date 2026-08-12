"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StudentAvatar } from "@/components/student-avatar";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { EquippedItem, PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

/**
 * The student app chrome, built to the design prototype: a sticky header with
 * the character, streak and gem balance, and a five-item bottom bar.
 *
 * The prototype renders inside a 390x844 iPhone frame. That frame is the
 * mockup's presentation chrome rather than product UI, so this is a real
 * responsive mobile layout instead — full width on a phone, centred in a
 * phone-width column on a desktop, which is what the demo will be shown on.
 */

type NavKey = "learn" | "challenges" | "vault" | "rank" | "profile";

export function StudentShell({
  studentId,
  seed,
  overrides,
  items,
  streak,
  gems,
  children,
}: {
  studentId: string;
  seed: string;
  overrides: Partial<PeepConfig>;
  items: EquippedItem[];
  streak: number;
  gems: number;
  children: React.ReactNode;
}) {
  const base = `/student/${studentId}`;
  const pathname = usePathname();

  // Every student screen is live; a teacher assigning a unit has to appear here
  // without a refresh.
  useRealtimeRefresh([
    "topics",
    "level_scores",
    "notifications",
    "class_posts",
    "exams",
  ]);

  const nav: { key: NavKey; href: string; label: string }[] = [
    { key: "learn", href: base, label: "Learn" },
    { key: "challenges", href: `${base}/challenges`, label: "Challenges" },
    { key: "vault", href: `${base}/vault`, label: "Vault" },
    { key: "rank", href: `${base}/rank`, label: "Rank" },
    { key: "profile", href: `${base}/profile`, label: "Profile" },
  ];

  // The exercise flow is full-screen in the design — no header, no bottom bar.
  const immersive = pathname.includes("/practice/");

  // Derived here rather than passed in: the layout is a Server Component and
  // has no pathname, and this is the only place that needs it.
  const active: NavKey = pathname.endsWith(`/challenges`)
    ? "challenges"
    : pathname.includes("/vault")
      ? "vault"
      : pathname.includes("/rank")
        ? "rank"
        : pathname.includes("/profile") ||
            pathname.includes("/account") ||
            pathname.includes("/shop") ||
            pathname.includes("/avatar")
          ? "profile"
          : "learn";

  if (immersive) {
    return (
      <div data-persona="student" className="mx-auto w-full max-w-[430px] flex-1 font-ui">
        {children}
      </div>
    );
  }

  return (
    <div
      data-persona="student"
      className="mx-auto flex w-full max-w-[430px] flex-1 flex-col font-ui"
    >
      <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-[#ece8fb] bg-white px-4 py-2.5">
        <Link
          href={`${base}/account`}
          aria-label="Account"
          className="shrink-0 rounded-full outline-offset-2"
        >
          <StudentAvatar
            seed={seed}
            overrides={overrides}
            items={items}
            size={34}
            ring="#d3caf7"
            ringWidth={2}
          />
        </Link>

        <Pill
          title={`${streak} day streak`}
          icon={
            <span className="size-3.5 rotate-45 rounded-[3px] bg-[#8b83c4]" />
          }
          value={streak}
        />

        <span className="flex-1" />

        <Link href={`${base}/shop`} aria-label="Open shop">
          <Pill
            title="Gems — spend them in the shop"
            icon={
              <span
                className="size-4 bg-[#3d6fe0]"
                style={{
                  clipPath: "polygon(50% 0%,100% 38%,80% 100%,20% 100%,0% 38%)",
                }}
              />
            }
            value={gems}
          />
        </Link>
      </header>

      <main className="flex-1 pb-2">{children}</main>

      <nav className="sticky bottom-0 z-20 flex justify-around border-t border-[#ece8fb] bg-white px-1 pb-1.5 pt-2.5">
        {nav.map((item) => {
          const on = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="grid h-5 place-items-center">
                {item.key === "profile" ? (
                  <StudentAvatar
                    seed={seed}
                    overrides={overrides}
                    size={20}
                    ring={on ? "#534ab7" : null}
                    ringWidth={2}
                    background="#dcd8f1"
                  />
                ) : (
                  <NavIcon kind={item.key} color={on ? "#534ab7" : "#a9a3cf"} />
                )}
              </span>
              <span
                className="text-[9.5px] font-bold"
                style={{ color: on ? "#534ab7" : "#a9a3cf" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Pill({
  icon,
  value,
  title,
}: {
  icon: React.ReactNode;
  value: number;
  title: string;
}) {
  return (
    <span
      title={title}
      className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[#ece8fb] bg-white px-3 py-1.5"
    >
      {icon}
      <span className="font-display text-[15px] font-extrabold text-[#3a3550]">
        {value}
      </span>
    </span>
  );
}

/** The prototype draws its nav glyphs from divs; these are the SVG equivalents. */
function NavIcon({ kind, color }: { kind: NavKey; color: string }) {
  const common = { fill: color, width: 20, height: 20 };
  if (kind === "learn") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M12 3 3 9v11h6v-6h6v6h6V9z" />
      </svg>
    );
  }
  if (kind === "challenges") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 11h8v1.6H8zm0 4h8v1.6H8z" />
      </svg>
    );
  }
  if (kind === "vault") {
    return (
      <svg viewBox="0 0 24 24" {...common} aria-hidden>
        <path d="M8 8V6a4 4 0 1 1 8 0v2h2v12H6V8zm2 0h4V6a2 2 0 1 0-4 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common} aria-hidden>
      <path d="M5 4h14l-1.5 7.5A5.5 5.5 0 0 1 13 15.8V18h4v2H7v-2h4v-2.2a5.5 5.5 0 0 1-4.5-4.3z" />
    </svg>
  );
}
