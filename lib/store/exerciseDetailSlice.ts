import type { StateCreator } from "zustand";
import type { AppState } from "./types";

export interface ExerciseDetailSlice {
  exerciseDetailId: string | null;
  openExerciseDetail: (id: string) => void;
  closeExerciseDetail: () => void;
}

export const createExerciseDetailSlice: StateCreator<AppState, [], [], ExerciseDetailSlice> = (set) => ({
  exerciseDetailId: null,
  openExerciseDetail: (id) => set(() => ({ exerciseDetailId: id })),
  closeExerciseDetail: () => set(() => ({ exerciseDetailId: null })),
});
