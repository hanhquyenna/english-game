"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Award,
  BookOpen,
  Flame,
  Gem,
  User,
  Zap,
} from "lucide-react";
import { StudentAvatar } from "@/components/student-avatar";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { EquippedItem, PeepConfig } from "@/lib/peeps";
import { cn } from "@/lib/utils";

/**
 * Student app chrome, ported from the prototype's TopBar + BottomNav.
 *
 * TopBar (`styles.topBar`): 62px min height, 16/10 padding, 8px gap, 2px
 * bottom border, card background. BottomNav (`styles.bottomNav`): 2px top
 * border, 34x27 icon plate that fills with the primary colour when active,
 * 8px uppercase mono label.
 *
 * The avatar is our real Open Peeps character, not the prototype's placeholder
 * initials circle — only its frame follows the design.
 */

type NavKey = "learn" | "challenges" | "vault" | "rank" | "profile";

const NAV_ICONS = {
  learn: BookOpen,
  challenges: Zap,
  vault: Archive,
  rank: Award,
  profile: User,
} as const;

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

  // Exercise, shop, account and the avatar picker are full-screen in the
  // prototype: no top bar, no bottom nav.
  const bare =
    pathname.includes("/practice/") ||
    pathname.includes("/shop") ||
    pathname.includes("/account") ||
    pathname.includes("/avatar");

  const active: NavKey = pathname.endsWith("/challenges")
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

  return (
    <div
      data-persona="student"
      className="mx-auto flex w-full max-w-[430px] flex-1 flex-col bg-st-bg text-st-fg"
    >
      {!bare ? (
        <header className="sticky top-0 z-20 flex min-h-[62px] items-center gap-2 border-b-2 border-st-fg bg-st-card px-4 py-2.5">
          <Link
            href={`${base}/account`}
            aria-label="Account"
            className="shrink-0 transition-opacity active:opacity-70"
          >
            <StudentAvatar
              seed={seed}
              overrides={overrides}
              items={items}
              size={36}
              shape="square"
              ring="var(--st-fg)"
              ringWidth={2}
              background="var(--st-peach)"
            />
          </Link>

          <span className="flex min-h-[36px] items-center gap-1.5 px-2.5">
            <Flame size={16} className="text-st-primary" aria-hidden />
            <span>
              <span className="block text-[14px] font-black leading-tight text-st-fg">
                {streak}
              </span>
              <span className="st-mono block text-st-muted-fg">streak</span>
            </span>
          </span>

          <span className="flex-1" />

          <Link
            href={`${base}/shop`}
            aria-label="Avatar shop"
            className="flex min-h-[36px] items-center gap-1.5 px-2.5 transition-opacity active:opacity-70"
          >
            <Gem size={16} className="text-st-primary" aria-hidden />
            <span className="text-[14px] font-black text-st-fg">{gems}</span>
          </Link>
        </header>
      ) : null}

      <main className="flex-1">{children}</main>

      {!bare ? (
        <nav className="sticky bottom-0 z-20 flex border-t-2 border-st-fg bg-st-card pb-[10px] pt-2">
          {nav.map((item) => {
            const on = item.key === active;
            const Glyph = NAV_ICONS[item.key];
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-[3px] transition-opacity active:opacity-70"
              >
                <span
                  className={cn(
                    "flex h-[27px] w-[34px] items-center justify-center rounded-[2px]",
                  )}
                  style={{
                    backgroundColor: on ? "var(--st-primary)" : "transparent",
                  }}
                >
                  <Glyph
                    size={17}
                    aria-hidden
                    style={{
                      color: on
                        ? "var(--st-primary-fg)"
                        : "var(--st-muted-fg)",
                    }}
                  />
                </span>
                <span
                  className="st-mono text-[8px] font-extrabold uppercase"
                  style={{
                    color: on ? "var(--st-primary)" : "var(--st-muted-fg)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
