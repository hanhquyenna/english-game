"use client";

import * as React from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface StateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClickAction?: () => Promise<boolean | void> | boolean | void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

export type ButtonStatus = "default" | "pressed" | "loading" | "success" | "error";

export function StateButton({
  onClickAction,
  onClick,
  disabled,
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: StateButtonProps) {
  const [status, setStatus] = React.useState<ButtonStatus>("default");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    if (!onClickAction || status === "loading" || disabled) return;

    // Step 1: Pressed (<100ms)
    setStatus("pressed");

    // Step 2: Show loading spinner if action takes >300ms
    const loadingTimer = setTimeout(() => {
      setStatus("loading");
    }, 300);

    try {
      const result = await onClickAction();
      clearTimeout(loadingTimer);

      if (result === false) {
        setStatus("error");
        setTimeout(() => setStatus("default"), 2000);
      } else {
        setStatus("success");
        setTimeout(() => setStatus("default"), 2000);
      }
    } catch (err) {
      clearTimeout(loadingTimer);
      setStatus("error");
      setTimeout(() => setStatus("default"), 2000);
    }
  };

  const isLoading = status === "loading";
  const isPressed = status === "pressed";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <button
      {...props}
      disabled={disabled || isLoading || isPressed}
      onClick={handleClick}
      className={cn(
        buttonVariants({ variant, size }),
        "relative transition-all active:scale-95 duration-100",
        isPressed && "opacity-80 scale-95",
        isSuccess && "bg-success hover:bg-success text-white border-success",
        isError && "bg-danger hover:bg-danger text-white border-danger",
        className,
      )}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang xử lý...</span>
        </span>
      ) : isSuccess ? (
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Thành công</span>
        </span>
      ) : isError ? (
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Thất bại</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
