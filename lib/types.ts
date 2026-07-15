export type Goal = string;

export type Location = "home" | "gym";

export type EquipmentOption = string;

export interface OnboardingProfile {
  goal: Goal | null;
}

export type ExerciseTarget = { reps: number; side?: "per-side" } | { seconds: number };

export interface RoutineExercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  sets: number;
  target: ExerciseTarget;
}

export type RoutineStatus = "empty" | "forming" | "ready" | "finalized";

export interface Routine {
  id: string;
  title: string;
  subtitle: string;
  exercises: RoutineExercise[];
  status: RoutineStatus;
  dayIndex?: number | null;
  totalDays?: number | null;
}

export type ChatMessageKind = "text" | "guardrail" | "patch";

export interface ChatMessage {
  id: string;
  role: "coach" | "user";
  kind: ChatMessageKind;
  text: string;
  chip?: string;
}

export type PreviewState = "chat-focus" | "docked" | "full-sheet" | "finalized";

export type WorkoutPhase = "exercising" | "resting" | "complete";

export interface UserProfileData {
  id: string;
  userId: string;
  goal: string | null;
  location: Location | null;
  equipment: string[];
  sessionDurationMinutes: number | null;
  injuries: unknown;
  injuriesNotes: string | null;
  unitsPreference: string;
}

export interface RoutineSummary {
  id: string;
  title: string;
  subtitle: string | null;
  status: RoutineStatus;
  dayIndex: number | null;
  totalDays: number | null;
  updatedAt: string;
}

export interface RecentPr {
  exerciseName: string;
  value: number;
  unit: "reps";
}

export interface StatsData {
  totalWorkouts: number;
  streakDays: number;
  weeklyVolume: number[];
  recentPr: RecentPr | null;
}
