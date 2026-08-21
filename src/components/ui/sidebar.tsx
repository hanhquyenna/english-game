"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon | string;
};

export type SidebarGroupData = {
  title: string;
  items: SidebarItem[];
};

export function SidebarGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function SidebarMenuItem({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon | string | React.ComponentType<{ size?: number; className?: string }>;
  isActive?: boolean;
}) {
  const pathname = usePathname();
  const active =
    isActive ??
    (pathname === href || (href !== "/" && pathname.startsWith(href + "/")));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--persona-soft)] font-semibold text-[var(--persona)]"
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
      )}
    >
      {typeof Icon === "function" ? (
        <Icon size={16} />
      ) : typeof Icon === "object" && Icon !== null ? (
        // @ts-expect-error Lucide Icon component
        <Icon size={16} />
      ) : null}
      <span>{label}</span>
    </Link>
  );
}
