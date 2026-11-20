import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    success: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
    outline: "border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
