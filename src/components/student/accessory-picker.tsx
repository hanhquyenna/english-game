"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { setEquippedAccessories } from "@/lib/actions/student";
import { cn } from "@/lib/utils";

type Accessory = {
  id: string;
  label: string;
  emoji: string;
  unlocked: boolean;
  requirement: string;
};

const MAX_EQUIPPED = 2;

/**
 * Locked accessories stay visible with their real requirement showing — that
 * is the whole motivational point, and it is honest: every requirement is a
 * milestone the Level Engine actually tracks.
 */
export function AccessoryPicker({
  studentId,
  accessories,
  equipped,
}: {
  studentId: string;
  accessories: Accessory[];
  equipped: string[];
}) {
  const [selected, setSelected] = useState<string[]>(equipped);
  const [pending, start] = useTransition();

  function toggle(accessory: Accessory) {
    if (!accessory.unlocked) {
      toast.info(`Chưa mở khoá — ${accessory.requirement}`);
      return;
    }

    const next = selected.includes(accessory.id)
      ? selected.filter((id) => id !== accessory.id)
      : [...selected, accessory.id].slice(-MAX_EQUIPPED);

    setSelected(next);
    start(async () => {
      try {
        await setEquippedAccessories(studentId, next);
      } catch (e) {
        setSelected(selected); // put it back if the write failed
        toast.error(e instanceof Error ? e.message : "Không lưu được");
      }
    });
  }

  const unlockedCount = accessories.filter((a) => a.unlocked).length;

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Đã mở khoá {unlockedCount}/{accessories.length} phụ kiện.
      </p>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {accessories.map((accessory) => {
          const isOn = selected.includes(accessory.id);
          return (
            <li key={accessory.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(accessory)}
                aria-pressed={isOn}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-colors",
                  isOn
                    ? "border-[var(--persona)] bg-[var(--persona-soft)]"
                    : accessory.unlocked
                      ? "bg-card hover:border-[var(--persona-border)]"
                      : "border-dashed bg-black/3 opacity-70",
                )}
              >
                <span
                  className={cn("text-2xl", !accessory.unlocked && "grayscale")}
                  aria-hidden
                >
                  {accessory.unlocked ? accessory.emoji : <Lock size={20} className="inline text-st-muted-fg" />}
                </span>
                <span className="text-xs font-medium">{accessory.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {accessory.unlocked
                    ? isOn
                      ? "Đang đeo"
                      : "Bấm để đeo"
                    : accessory.requirement}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
