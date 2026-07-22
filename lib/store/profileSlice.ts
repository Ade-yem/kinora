import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Location, UserProfileData } from "@/types";
import { apiFetch, apiGet, apiPatch } from "@/lib/api-client";
import { UserProfile } from "@/app/generated/prisma/client";

export interface ProfileUpdateInput {
  weight?: number | null;
  height?: number | null;
  dateOfBirth?: string | null;
  biologicalSex?: string | null;
  experienceLevel?: string | null;
  preferredLocation?: Location | null;
  unitsPreference?: string;
  logoStyle?: "pulse-bubble" | "rep-loop" | "signal-bars";
}

export interface ProfileSlice {
  profile: UserProfileData | null;
  profileStatus: "idle" | "loading" | "loaded" | "error";
  fetchProfile: () => Promise<void>;
  updateProfile: (partial: ProfileUpdateInput) => Promise<void>;
}

export const createProfileSlice: StateCreator<AppState, [], [], ProfileSlice> = (set) => ({
  profile: null,
  profileStatus: "idle",

  fetchProfile: async () => {
    set({ profileStatus: "loading" });
    try {
      const profile = await apiGet<UserProfileData>("/api/profile");
      set({ profile, profileStatus: "loaded" });
    } catch {
      set({ profileStatus: "error" });
    }
  },
  updateProfile: async (partial) => {
    const profile = await apiPatch<UserProfileData>("/api/profile", partial);
    set({ profile, profileStatus: "loaded" });
  },
});
