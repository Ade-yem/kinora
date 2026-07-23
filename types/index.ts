export type Goal = string;

export type Location = "home" | "gym";

export type EquipmentOption = string;

export interface OnboardingProfile {
  experienceLevel: string | null;
  preferredLocation: Location | null;
}

export type ExerciseTarget = { reps: number; side?: "per-side" } | { seconds: number };

export interface RoutineExercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  sets: number;
  target: ExerciseTarget;
  shortDemoVideoUrl?: string | null;
}

export interface ExerciseInstruction {
  setup: {
    posture_and_alignment: string;
    grip_and_stance: string;
  },
  execution: {
    phase_by_phase_steps: string;
    range_of_motion: string;
    tempo: string;
  },
  breathing_technique: {
    inhale: string;
    exhale: string;
    key_rule: string;
  },
  safety_and_common_mistakes: string[];
}



export interface ExerciseDetail {
  id: string;
  name: string;
  shortDemoVideoUrl: string | null;
  inDepthExplanationVideoUrl: string | null;
  difficultyLevel: string | null;
  targetMuscleGroup: string | null;
  primeMoverMuscle: string | null;
  secondaryMuscle: string | null;
  tertiaryMuscle: string | null;
  primaryEquipment: string | null;
  secondaryEquipment: string | null;
  posture: string | null;
  grip: string | null;
  bodyRegion: string | null;
  instructions: ExerciseInstruction;
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
  chatSessionId?: string | null;
  chatSessionTitle?: string | null;
  programId?: string | null;
}

export type ChatMessageKind = "text" | "guardrail" | "patch";

export interface ChatMessage {
  id: string;
  role: "coach" | "user";
  kind: ChatMessageKind;
  text: string;
  chip?: string;
  thoughts?: string;
}

export type PreviewState = "chat-focus" | "docked" | "full-sheet" | "finalized";

export type WorkoutPhase = "exercising" | "resting" | "complete";

export interface UserProfileData {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  dateOfBirth: string | null;
  biologicalSex: string | null;
  experienceLevel: string | null;
  preferredLocation: Location | null;
  unitsPreference: string;
  logoStyle: "pulse-bubble" | "rep-loop" | "signal-bars";
}

export interface RoutineSummary {
  id: string;
  title: string;
  subtitle: string | null;
  status: RoutineStatus;
  dayIndex: number;
  totalDays: number;
  updatedAt: string;
  programId: string;
  chatSessionId: string | null;
  exerciseCount: number;
  estimatedDurationMinutes: number;
  logs?: {
    id: string;
    performedAt: string;
    durationSeconds: number | null;
    totalVolumeKg: number | null;
  }[];
}

export interface ProgramSummary {
  id: string;
  title: string;
  subtitle: string | null;
  status: RoutineStatus;
  totalDays: number;
  updatedAt: string;
  chatSessionId: string | null;
  exerciseCount: number;
  estimatedDurationMinutes: number;
  firstRoutineId: string;
  logs?: {
    id: string;
    performedAt: string;
    durationSeconds: number | null;
    totalVolumeKg: number | null;
  }[];
}

export interface Program {
  id: string;
  title: string;
  subtitle: string | null;
  status: RoutineStatus;
  totalDays: number;
  chatSessionId: string | null;
  updatedAt: string;
  routines: RoutineSummary[];
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
