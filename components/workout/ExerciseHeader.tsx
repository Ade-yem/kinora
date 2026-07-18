"use client";

import { ProgressBar } from "@/components/ui/ProgressDots";
import { ChevronLeft, X } from "lucide-react";

export function ExerciseHeader({
  exerciseIndex,
  total,
  onExitClick,
}: {
  exerciseIndex: number;
  total: number;
  onExitClick: () => void;
}) {
  return (
    <div className="px-1 pt-1">
      <div className="flex items-center justify-between">
        <button
          onClick={onExitClick}
          aria-label="Exit Workout"
          className="text-lg text-cream/80 p-1 hover:bg-cream/10 rounded-lg cursor-pointer transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-cream/60">
          Exercise {exerciseIndex + 1} of {total}
        </span>
        <button
          onClick={onExitClick}
          aria-label="Exit Workout"
          className="text-lg text-cream/80 p-1 hover:bg-cream/10 rounded-lg cursor-pointer transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-3.5">
        <ProgressBar
          total={total}
          current={exerciseIndex + 1}
          activeClassName="bg-volt"
          trackClassName="bg-cream/15"
        />
      </div>
    </div>
  );
}
