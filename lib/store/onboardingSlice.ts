import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Goal, OnboardingProfile } from "@/types";

export interface OnboardingSlice {
  onboarding: OnboardingProfile;
  setGoal: (goal: Goal) => void;
}

export const createOnboardingSlice: StateCreator<AppState, [], [], OnboardingSlice> = (set) => ({
  onboarding: { goal: null },
  setGoal: (goal) => set((s) => ({ onboarding: { ...s.onboarding, goal } })),
});
