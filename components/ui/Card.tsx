import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl bg-surface-card shadow-[0_20px_50px_-12px_oklch(0.22_0.02_60_/_0.18)] ${className}`}
      {...props}
    />
  );
}
