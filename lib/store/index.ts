import { create } from "zustand";
import type { AppState } from "./types";
import { createOnboardingSlice } from "./onboardingSlice";
import { createProfileSlice } from "./profileSlice";
import { createChatSlice } from "./chatSlice";
import { createRoutinesSlice } from "./routinesSlice";
import { createWorkoutSlice } from "./workoutSlice";
import { createStatsSlice } from "./statsSlice";
import { createExerciseDetailSlice } from "./exerciseDetailSlice";

export const useAppStore = create<AppState>()((...a) => ({
  ...createOnboardingSlice(...a),
  ...createProfileSlice(...a),
  ...createChatSlice(...a),
  ...createRoutinesSlice(...a),
  ...createWorkoutSlice(...a),
  ...createStatsSlice(...a),
  ...createExerciseDetailSlice(...a),
}));
