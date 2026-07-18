"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExerciseHeader } from "@/components/workout/ExerciseHeader";
import { RepsCounter } from "@/components/workout/RepsCounter";
import { TimedHold } from "@/components/workout/TimedHold";
import { RestTimer } from "@/components/workout/RestTimer";
import { CompletionCelebration } from "@/components/workout/CompletionCelebration";
import { ExerciseDetailSheet } from "@/components/chat/ExerciseDetailSheet";
import { ExitConfirmModal } from "@/components/workout/ExitConfirmModal";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function ActiveWorkoutPage() {
  useRequireAuth();
  const router = useRouter();
  const routine = useAppStore((s) => s.routine);
  const workout = useAppStore((s) => s.workout);
  const completeSet = useAppStore((s) => s.completeSet);
  const finishRest = useAppStore((s) => s.finishRest);
  const openExerciseDetail = useAppStore((s) => s.openExerciseDetail);
  const savePartialWorkout = useAppStore((s) => s.savePartialWorkout);

  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  if (routine.exercises.length === 0) return null;

  if (workout.phase === "complete") {
    return (
      <main className="flex min-h-dvh flex-1 flex-col bg-surface-ink px-6 text-cream">
        <CompletionCelebration routine={routine} />
      </main>
    );
  }

  const exercise = routine.exercises[workout.exerciseIndex];
  const setNumber = workout.setIndex + 1;
  const isTimed = "seconds" in exercise.target;

  if (workout.phase === "resting") {
    return (
      <main className="flex min-h-dvh flex-1 flex-col overflow-hidden bg-surface-ink text-cream">
        <RestTimer
          nextExercise={exercise}
          nextSetNumber={setNumber}
          nextIndex={workout.exerciseIndex}
          total={routine.exercises.length}
          onRestComplete={finishRest}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-surface-ink px-6 text-cream">
      <ExerciseHeader
        exerciseIndex={workout.exerciseIndex}
        total={routine.exercises.length}
        onExitClick={() => setIsExitModalOpen(true)}
      />
      {isTimed ? (
        <TimedHold
          exercise={exercise}
          setNumber={setNumber}
          onSetDone={completeSet}
          onInfoClick={() => openExerciseDetail(exercise.id)}
        />
      ) : (
        <RepsCounter
          exercise={exercise}
          setNumber={setNumber}
          onSetDone={completeSet}
          onInfoClick={() => openExerciseDetail(exercise.id)}
        />
      )}
      <ExerciseDetailSheet />
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={async () => {
          setIsExitModalOpen(false);
          await savePartialWorkout();
        }}
        completedSetsCount={workout.entries.reduce((sum, entry) => sum + entry.sets.length, 0)}
      />
    </main>
  );
}
