import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Location, OnboardingProfile } from "@/types";

export interface OnboardingSlice {
  onboarding: OnboardingProfile;
  setExperienceLevel: (experienceLevel: string) => void;
  setPreferredLocation: (preferredLocation: Location) => void;
}

export const createOnboardingSlice: StateCreator<AppState, [], [], OnboardingSlice> = (set) => ({
  onboarding: { experienceLevel: null, preferredLocation: null },
  setExperienceLevel: (experienceLevel) =>
    set((s) => ({ onboarding: { ...s.onboarding, experienceLevel } })),
  setPreferredLocation: (preferredLocation) =>
    set((s) => ({ onboarding: { ...s.onboarding, preferredLocation } })),
});
