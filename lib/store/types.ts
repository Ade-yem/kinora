import type { OnboardingSlice } from "./onboardingSlice";
import type { ProfileSlice } from "./profileSlice";
import type { ChatSlice } from "./chatSlice";
import type { RoutinesSlice } from "./routinesSlice";
import type { WorkoutSlice } from "./workoutSlice";
import type { StatsSlice } from "./statsSlice";
import type { ExerciseDetailSlice } from "./exerciseDetailSlice";

export interface AppState
  extends OnboardingSlice,
    ProfileSlice,
    ChatSlice,
    RoutinesSlice,
    WorkoutSlice,
    StatsSlice,
    ExerciseDetailSlice {}
