import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { StatsData } from "@/types";
import { apiGet } from "@/lib/api-client";

export interface StatsSlice {
  stats: StatsData | null;
  statsStatus: "idle" | "loading" | "loaded" | "error";
  fetchStats: () => Promise<void>;
}

export const createStatsSlice: StateCreator<AppState, [], [], StatsSlice> = (set) => ({
  stats: null,
  statsStatus: "idle",

  fetchStats: async () => {
    set({ statsStatus: "loading" });
    try {
      const stats = await apiGet<StatsData>("/api/stats");
      set({ stats, statsStatus: "loaded" });
    } catch {
      set({ statsStatus: "error" });
    }
  },
});
