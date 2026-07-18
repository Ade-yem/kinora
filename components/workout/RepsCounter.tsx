"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ExerciseVisual } from "./ExerciseVisual";
import { Info } from "lucide-react";
import type { RoutineExercise } from "@/types";

export function RepsCounter({
  exercise,
  setNumber,
  onSetDone,
  onInfoClick,
}: {
  exercise: RoutineExercise;
  setNumber: number;
  onSetDone: (performed: { reps: number }) => void;
  onInfoClick?: () => void;
}) {
  const targetReps = "reps" in exercise.target ? exercise.target.reps : 0;
  const [reps, setReps] = useState(targetReps);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4">
        <ExerciseVisual tone="volt" exercise={exercise} />
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

      <div className="flex flex-1 flex-col items-center justify-center gap-2.5">
        <div className="text-xs font-bold tracking-wide text-cream/50">
          SET {setNumber} OF {exercise.sets}
        </div>
        <div className="font-display text-6xl font-bold">
          {reps} <span className="text-2xl font-semibold text-cream/50">reps</span>
        </div>
        <div className="mt-1.5 flex gap-2.5">
          <button
            type="button"
            aria-label="Decrease reps"
            onClick={() => setReps((r) => Math.max(0, r - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream/10 text-base"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Increase reps"
            onClick={() => setReps((r) => r + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream/10 text-base"
          >
            +
          </button>
        </div>
      </div>

      <div className="pb-2">
        <Button variant="primary" onClick={() => onSetDone({ reps })}>
          ✓ Mark Set Done
        </Button>
      </div>
    </div>
  );
}
