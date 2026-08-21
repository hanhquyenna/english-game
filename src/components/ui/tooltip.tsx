"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <Popover>{children}</Popover>;
}

export function TooltipTrigger({
  children,
  className,
}: {
  children: React.ReactElement;
  className?: string;
}) {
  return <PopoverTrigger render={children} className={className} />;
}

export function TooltipContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PopoverContent className={className}>
      {children}
    </PopoverContent>
  );
}
