"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlarmClockCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runStreakCheck } from "@/lib/actions/streak";

/**
 * Runs the daily streak check on demand.
 *
 * This is the same function the scheduled job calls (see
 * /api/cron/streak-check) — the button exists so a demo does not have to wait
 * for a real day to roll over, not to fake the result.
 */
export function StreakCheckButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const r = await runStreakCheck();
            if (r.atRisk === 0 && r.broken === 0) {
              toast.success("Đã kiểm tra: không có streak nào cần cảnh báo.");
            } else {
              toast.success(
                `Đã gửi cảnh báo: ${r.atRisk} sắp mất streak, ${r.broken} đã mất streak.`,
              );
            }
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Không chạy được kiểm tra",
            );
          }
        })
      }
    >
      {pending ? (
        "Đang kiểm tra…"
      ) : (
        <>
          <AlarmClockCheck size={14} aria-hidden />
          Kiểm tra streak hôm nay
        </>
      )}
    </Button>
  );
}
