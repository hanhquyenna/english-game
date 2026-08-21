"use client";

import { useEffect, useState } from "react";
import { toastManager, type ToastItem } from "@/lib/toast-store";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-top-2 duration-200",
              isSuccess && "bg-emerald-950/90 text-emerald-100 border-emerald-800/60 backdrop-blur-md",
              isError && "bg-rose-950/90 text-rose-100 border-rose-800/60 backdrop-blur-md",
              !isSuccess && !isError && "bg-slate-900/90 text-slate-100 border-slate-700/60 backdrop-blur-md",
            )}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}

            <div className="flex-1 leading-snug">{toast.message}</div>

            <button
              onClick={() => toastManager.dismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-md shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
