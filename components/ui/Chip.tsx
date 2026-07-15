import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function ChipButton({ selected = false, className = "", ...props }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
        selected
          ? "border-2 border-volt bg-volt/15 text-ink"
          : "border-[1.5px] border-ink/15 text-ink hover:border-ink/30"
      } ${className}`}
      {...props}
    />
  );
}

export function Chip({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`inline-flex items-center rounded-full border-[1.5px] border-volt px-3 py-1.5 text-xs font-semibold text-ink ${className}`}
      {...props}
    />
  );
}
