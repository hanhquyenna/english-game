"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/personas";

export type NavItem = { href: string; label: string; icon: string };

/**
 * One shell, three densities.
 *
 * Teacher and parent get a sidebar on desktop; the student gets a bottom bar,
 * because that is the shape of the app they actually use. All three share the
 * same header, type scale and card primitives, so switching personas reads as
 * switching sections of one product (§3).
 */
export function PersonaShell({
  persona,
  title,
  subtitle,
  nav,
  headerRight,
  children,
}: {
  persona: Persona;
  title: string;
  subtitle?: string;
  nav: NavItem[];
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bottomNav = persona === "student";

  const isActive = (href: string) =>
    pathname === href || (href !== nav[0]?.href && pathname.startsWith(href));

  return (
    <div data-persona={persona} className="flex min-h-full flex-1 flex-col">
      <header
        className="sticky top-0 z-30 border-b bg-[var(--persona)] text-white"
        style={{ borderColor: "color-mix(in oklab, var(--persona) 70%, black)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            title="Đổi người dùng"
          >
            Beeblast
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-xs text-white/75">{subtitle}</p>
            ) : null}
          </div>
          {headerRight}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-5">
        {!bottomNav ? (
          <nav className="hidden w-52 shrink-0 md:block">
            <ul className="sticky top-20 space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-[var(--persona-soft)] font-semibold text-[var(--persona)]"
                        : "text-muted-foreground hover:bg-black/4 hover:text-foreground",
                    )}
                  >
                    <span aria-hidden>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <main
          className={cn("min-w-0 flex-1", bottomNav && "pb-24")}
        >
          {children}
        </main>
      </div>

      {/* Mobile / student navigation */}
      <nav
        className={cn(
          "sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur",
          !bottomNav && "md:hidden",
        )}
      >
        <ul className="mx-auto flex w-full max-w-6xl">
          {nav.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-medium transition-colors",
                  isActive(item.href)
                    ? "text-[var(--persona)]"
                    : "text-muted-foreground",
                )}
              >
                <span aria-hidden className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
