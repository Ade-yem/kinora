import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { WorkoutPhase } from "@/types";
import { apiPost } from "@/lib/api-client";
import { enqueuePendingWorkoutLog } from "@/lib/offlineQueue";

interface WorkoutSetEntry {
  setIndex: number;
  reps?: number;
  seconds?: number;
}

interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: WorkoutSetEntry[];
}

interface WorkoutState {
  exerciseIndex: number;
  setIndex: number;
  phase: WorkoutPhase;
  entries: WorkoutExerciseEntry[];
  startedAt: number | null;
  submitted: boolean;
}

export interface WorkoutSlice {
  workout: WorkoutState;
  resetWorkout: () => void;
  completeSet: (performed?: { reps?: number; seconds?: number }) => void;
  finishRest: () => void;
  submitWorkout: () => Promise<void>;
  savePartialWorkout: () => Promise<void>;
  flushPendingWorkoutLogs: () => Promise<void>;
}

function recordEntry(
  entries: WorkoutExerciseEntry[],
  exerciseId: string,
  setIndex: number,
  performed: { reps?: number; seconds?: number }
): WorkoutExerciseEntry[] {
  const setRecord: WorkoutSetEntry = { setIndex, reps: performed.reps, seconds: performed.seconds };
  const idx = entries.findIndex((e) => e.exerciseId === exerciseId);

  if (idx === -1) {
    return [...entries, { exerciseId, sets: [setRecord] }];
  }

  const updated = [...entries];
  updated[idx] = { ...updated[idx], sets: [...updated[idx].sets, setRecord] };
  return updated;
}

const initialWorkout: WorkoutState = {
  exerciseIndex: 0,
  setIndex: 0,
  phase: "exercising",
  entries: [],
  startedAt: null,
  submitted: false,
};

export const createWorkoutSlice: StateCreator<AppState, [], [], WorkoutSlice> = (set, get) => ({
  workout: initialWorkout,

  resetWorkout: () =>
    set(() => ({ workout: { ...initialWorkout, startedAt: Date.now() } })),

  completeSet: (performed = {}) => {
    const state = get();
    const { exercises } = state.routine;
    const { exerciseIndex, setIndex, entries } = state.workout;
    const currentExercise = exercises[exerciseIndex];
    if (!currentExercise) return;

    const nextEntries = recordEntry(entries, currentExercise.id, setIndex, performed);
    let nextWorkout: WorkoutState;

    if (setIndex + 1 < currentExercise.sets) {
      nextWorkout = { ...state.workout, setIndex: setIndex + 1, phase: "resting", entries: nextEntries };
    } else if (exerciseIndex + 1 < exercises.length) {
      nextWorkout = {
        ...state.workout,
        exerciseIndex: exerciseIndex + 1,
        setIndex: 0,
        phase: "resting",
        entries: nextEntries,
      };
    } else {
      nextWorkout = { ...state.workout, phase: "complete", entries: nextEntries };
    }

    set({ workout: nextWorkout });

    if (nextWorkout.phase === "complete") {
      get().submitWorkout();
    }
  },

  finishRest: () => set((s) => ({ workout: { ...s.workout, phase: "exercising" } })),

  savePartialWorkout: async () => {
    set((s) => ({ workout: { ...s.workout, phase: "complete" } }));
    await get().submitWorkout();
  },

  submitWorkout: async () => {
    const state = get();
    if (state.workout.submitted || !state.routine.id) return;

    set((s) => ({ workout: { ...s.workout, submitted: true } }));

    const durationSeconds = state.workout.startedAt
      ? Math.round((Date.now() - state.workout.startedAt) / 1000)
      : undefined;

    const totalReps = state.workout.entries.reduce((sum, entry) => {
      return sum + entry.sets.reduce((setSum, set) => setSum + (set.reps || 0), 0);
    }, 0);
    const totalSeconds = state.workout.entries.reduce((sum, entry) => {
      return sum + entry.sets.reduce((setSum, set) => setSum + (set.seconds || 0), 0);
    }, 0);
    // 15kg per rep, or 0.8kg equivalent per second hold
    const totalVolumeKg = totalReps * 15 + totalSeconds * 0.8;

    try {
      await apiPost("/api/workouts", {
        routineId: state.routine.id,
        durationSeconds,
        entries: state.workout.entries,
        totalVolumeKg,
      });
    } catch (err) {
      // Best-effort: enqueue the payload instead of swallowing it
      try {
        await enqueuePendingWorkoutLog({
          routineId: state.routine.id,
          durationSeconds,
          entries: state.workout.entries,
          totalVolumeKg,
        });
      } catch (enqueueErr) {
        console.error("Failed to enqueue pending workout log:", enqueueErr);
      }
    }
  },

  flushPendingWorkoutLogs: async () => {
    const { getPendingWorkoutLogs, removePendingWorkoutLog } = await import("@/lib/offlineQueue");
    const log = await getPendingWorkoutLogs();
    if (!log) return;

    try {
      await apiPost("/api/workouts", {
        routineId: log.routineId,
        durationSeconds: log.durationSeconds,
        entries: log.entries,
        totalVolumeKg: log.totalVolumeKg,
      });
      await removePendingWorkoutLog();
    } catch (err) {
      console.error("Failed to flush pending workout log:", err);
    }
  },
});
