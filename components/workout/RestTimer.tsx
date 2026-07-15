"use client";

import { useEffect, useRef, useState } from "react";
import { formatTarget } from "@/lib/mock-data";
import type { RoutineExercise } from "@/lib/types";

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

  const progressDeg = ((REST_SECONDS - remaining) / REST_SECONDS) * 360;

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
        <div
          className="flex h-48 w-48 items-center justify-center rounded-full border-[10px] border-cream/18"
          style={{
            backgroundImage: `conic-gradient(oklch(0.99 0.004 80) ${progressDeg}deg, transparent ${progressDeg}deg)`,
          }}
        >
          <div className="flex h-[calc(100%-10px)] w-[calc(100%-10px)] flex-col items-center justify-center rounded-full bg-[oklch(0.475_0.145_35)] text-center">
            <div className="font-display text-4xl font-bold">{formatSeconds(remaining)}</div>
            <div className="text-xs font-bold tracking-wide text-cream/75">RESTING</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={() => setRemaining((r) => r + 15)}
          className="flex-1 rounded-2xl border-[1.5px] border-cream/30 py-3.5 text-center font-display text-sm font-bold"
        >
          +15s
        </button>
        <button
          type="button"
          onClick={onRestComplete}
          className="flex-[1.3] rounded-2xl bg-cream py-3.5 text-center font-display text-[15px] font-bold text-[oklch(0.4_0.13_35)]"
        >
          Skip Rest →
        </button>
      </div>
    </div>
  );
}
