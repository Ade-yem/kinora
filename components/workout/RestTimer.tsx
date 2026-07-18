"use client";

import { useEffect, useRef, useState } from "react";
import { formatTarget } from "@/lib/utils";
import type { RoutineExercise } from "@/types";
import { ChevronRight } from "lucide-react";

const REST_SECONDS = 20;

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RestTimer({
  nextExercise,
  nextSetNumber,
  nextIndex,
  total,
  onRestComplete,
}: {
  nextExercise: RoutineExercise;
  nextSetNumber: number;
  nextIndex: number;
  total: number;
  onRestComplete: () => void;
}) {
  const [totalDuration, setTotalDuration] = useState(REST_SECONDS);
  const [remaining, setRemaining] = useState(REST_SECONDS);
  const onRestCompleteRef = useRef(onRestComplete);
  const firedRef = useRef(false);

  useEffect(() => {
    onRestCompleteRef.current = onRestComplete;
  });

  useEffect(() => {
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onRestCompleteRef.current();
      }
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  const handleAddSeconds = () => {
    setRemaining((r) => {
      const next = r + 15;
      setTotalDuration(next);
      return next;
    });
  };

  const progressRatio = totalDuration > 0 ? remaining / totalDuration : 0;
  const strokeDasharray = 2 * Math.PI * 80;
  const strokeDashoffset = strokeDasharray * (1 - progressRatio);

  return (
    <div className="flex flex-1 flex-col bg-[linear-gradient(165deg,oklch(0.55_0.16_35),oklch(0.4_0.13_35))] px-1">
      <div className="pt-7 text-center">
        <div className="text-xs font-bold tracking-wide text-cream/70">
          UP NEXT · {nextIndex + 1} OF {total}
        </div>
        <div className="mt-1.5 font-display text-xl font-bold">{nextExercise.name}</div>
        <div className="mt-0.5 text-[13px] text-cream/65">
          Set {nextSetNumber} of {nextExercise.sets} · {formatTarget(nextExercise)}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
        <div className="relative flex h-48 w-48 items-center justify-center">
          {/* Circular Progress SVG */}
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="96"
              cy="96"
              r="80"
              className="fill-none stroke-cream/15"
              strokeWidth="8"
            />
            {/* Animated Progress Bar */}
            <circle
              cx="96"
              cy="96"
              r="80"
              className="fill-none stroke-cream transition-all duration-300 ease-out"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Inner Text Ring */}
          <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[oklch(0.475_0.145_35)] text-center z-10 shadow-inner">
            <div className="font-display text-4xl font-bold">{formatSeconds(remaining)}</div>
            <div className="text-xs font-bold tracking-wide text-cream/75">RESTING</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={handleAddSeconds}
          className="flex-1 rounded-2xl border-[1.5px] border-cream/30 py-3.5 text-center font-display text-sm font-bold cursor-pointer hover:bg-cream/5 transition-colors"
        >
          +15s
        </button>
        <button
          type="button"
          onClick={onRestComplete}
          className="flex-[1.3] flex space-x-2 justify-center items-center rounded-2xl bg-cream py-3.5 text-center font-display text-[15px] font-bold text-[oklch(0.4_0.13_35)] cursor-pointer hover:bg-cream/90 transition-colors"
        >
          Skip Rest <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
