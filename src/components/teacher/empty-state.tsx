import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, text }: { icon?: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {Icon && <Icon className="size-5 text-muted-foreground" />}
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
