"use client";

import { useEffect, useRef, useState } from "react";
import { ExerciseVisual } from "./ExerciseVisual";
import { Info } from "lucide-react";
import type { RoutineExercise } from "@/types";

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimedHold({
  exercise,
  setNumber,
  onSetDone,
  onInfoClick,
}: {
  exercise: RoutineExercise;
  setNumber: number;
  onSetDone: (performed: { seconds: number }) => void;
  onInfoClick?: () => void;
}) {
  const totalSeconds = "seconds" in exercise.target ? exercise.target.seconds : 30;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const onSetDoneRef = useRef(onSetDone);
  const firedRef = useRef(false);

  useEffect(() => {
    onSetDoneRef.current = onSetDone;
  });

  useEffect(() => {
    if (isPaused) return;
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onSetDoneRef.current({ seconds: totalSeconds });
      }
      return;
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining, totalSeconds, isPaused]);

  const progress = Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100));

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4">
        <ExerciseVisual tone="coral" exercise={exercise} />
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="font-display text-2xl font-bold">{exercise.name}</h1>
          {onInfoClick && (
            <button
              type="button"
              onClick={onInfoClick}
              aria-label="View exercise details"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/10 text-cream/60 hover:bg-cream/20 hover:text-cream transition-all cursor-pointer active:scale-90"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-cream/50">
          {exercise.muscle} — {exercise.equipment}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="text-xs font-bold tracking-wide text-cream/50">
          SET {setNumber} OF {exercise.sets}
        </div>
        <div className={`font-display text-6xl font-bold text-coral transition-all ${isPaused ? "opacity-60 scale-95" : ""}`}>
          {formatSeconds(remaining)}
        </div>
        <div className="h-1.5 w-52 overflow-hidden rounded-full bg-cream/12">
          <div className={`h-full rounded-full bg-coral transition-all duration-300 ${isPaused ? "bg-coral/60 animate-pulse" : ""}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex gap-3 pb-2">
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? "Resume" : "Pause"}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl cursor-pointer transition active:scale-95 ${
            isPaused ? "bg-volt text-ink font-bold" : "bg-cream/10 text-cream hover:bg-cream/15"
          }`}
        >
          {isPaused ? "▶️" : "⏸"}
        </button>
        <button
          type="button"
          onClick={() => onSetDone({ seconds: totalSeconds - remaining })}
          className="flex-1 rounded-2xl bg-coral font-display text-[15px] font-bold text-cream cursor-pointer transition active:scale-95"
        >
          Skip to Next →
        </button>
      </div>
    </div>
  );
}
