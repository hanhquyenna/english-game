"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  Clock,
  GraduationCap,
  HelpCircle,
  Folder,
  FileText,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Persona } from "@/lib/personas";
import { SidebarGroup, SidebarMenuItem, type SidebarGroupData } from "@/components/ui/sidebar";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon | string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: BarChart3,
  materials: Folder,
  school: GraduationCap,
  students: Users,
  curriculum: BookOpen,
  lesson_plans: FileText,
  builder: CheckSquare,
  gradebook: ClipboardCheck,
  history: Clock,
  story: Megaphone,
  account: Settings,
  help: HelpCircle,
};

function renderNavIcon(icon: NavItem["icon"], size: number) {
  const Icon = typeof icon === "string" ? (ICON_MAP[icon] ?? GraduationCap) : icon;
  if (!Icon) return null;
  return <Icon size={size} aria-hidden />;
}

export function PersonaShell({
  persona,
  title,
  subtitle,
  nav,
  groups,
  headerRight,
  children,
}: {
  persona: Persona;
  title: string;
  subtitle?: string;
  nav?: NavItem[];
  groups?: SidebarGroupData[];
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bottomNav = persona === "student";

  const navItems = nav ?? [];
  const firstHref = groups?.[0]?.items?.[0]?.href ?? navItems[0]?.href ?? "";

  const isActive = (href: string) =>
    pathname === href || (href !== firstHref && pathname.startsWith(href + "/"));

  return (
    <div data-persona={persona} className="flex min-h-full flex-1 flex-col">
      <header
        className="sticky top-0 z-30 border-b bg-[var(--persona)] text-white"
        style={{ borderColor: "color-mix(in oklab, var(--persona) 70%, black)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
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
          <nav className="hidden w-56 shrink-0 md:block">
            {groups && groups.length > 0 ? (
              <div className="sticky top-20">
                {groups.map((group) => (
                  <SidebarGroup key={group.title} title={group.title}>
                    {group.items.map((item) => (
                      <SidebarMenuItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon}
                        isActive={isActive(item.href)}
                      />
                    ))}
                  </SidebarGroup>
                ))}
              </div>
            ) : (
              <ul className="sticky top-20 space-y-1">
                {navItems.map((item) => (
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
                      {renderNavIcon(item.icon, 17)}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
          {navItems.map((item) => (
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
                {renderNavIcon(item.icon, 20)}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
