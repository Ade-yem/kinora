import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Location, UserProfileData } from "@/types";
import { apiGet, apiPatch } from "@/lib/api-client";

export interface ProfileUpdateInput {
  goal?: string;
  location?: Location;
  equipment?: string[];
  sessionDurationMinutes?: number;
  injuriesNotes?: string;
  unitsPreference?: string;
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
