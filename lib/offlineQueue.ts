import { get, set, del } from "idb-keyval";

export interface WorkoutSetEntry {
  setIndex: number;
  reps?: number;
  seconds?: number;
}

export interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: WorkoutSetEntry[];
}

export interface PendingWorkoutLog {
  routineId: string;
  durationSeconds?: number;
  entries: WorkoutExerciseEntry[];
  totalVolumeKg: number;
}

const PENDING_KEY = "pendingWorkoutLogs";

export async function enqueuePendingWorkoutLog(log: PendingWorkoutLog): Promise<void> {
  if (typeof window === "undefined") return;
  await set(PENDING_KEY, log);
}

export async function getPendingWorkoutLogs(): Promise<PendingWorkoutLog | null> {
  if (typeof window === "undefined") return null;
  const log = await get<PendingWorkoutLog>(PENDING_KEY);
  return log || null;
}

export async function removePendingWorkoutLog(): Promise<void> {
  if (typeof window === "undefined") return;
  await del(PENDING_KEY);
}
