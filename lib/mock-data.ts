import type { RoutineExercise } from "./types";

export function formatTarget(exercise: RoutineExercise): string {
  const { target, sets } = exercise;
  if ("seconds" in target) return `${sets}×${target.seconds}s`;
  return target.side ? `${sets}×${target.reps}/side` : `${sets}×${target.reps}`;
}
