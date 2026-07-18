import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Routine, RoutineSummary, RoutineStatus } from "@/types";
import type { PaginatedResponse, PaginationMeta } from "@/lib/api/pagination";
import { apiGet, apiPatch } from "@/lib/api-client";

const emptyRoutine: Routine = {
  id: "",
  title: "",
  subtitle: "",
  exercises: [],
  status: "empty",
};

export interface RoutinesSlice {
  routines: RoutineSummary[];
  routinesPagination: PaginationMeta | null;
  routine: Routine;
  routineStatus: "idle" | "loading" | "loaded" | "not-found" | "error";
  fetchRoutines: (params?: { page?: number; pageSize?: number; status?: RoutineStatus }) => Promise<void>;
  fetchRoutineById: (id: string) => Promise<void>;
  finalizeRoutine: () => Promise<void>;
  fetchLatestRoutine: () => Promise<void>;
  fetchSessionRoutine: (chatSessionId: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
}

export const createRoutinesSlice: StateCreator<AppState, [], [], RoutinesSlice> = (set, get) => ({
  routines: [],
  routinesPagination: null,
  routine: emptyRoutine,
  routineStatus: "idle",

  fetchRoutines: async (params) => {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    if (params?.status) search.set("status", params.status);

    const query = search.toString();
    const { data, pagination } = await apiGet<PaginatedResponse<RoutineSummary>>(
      `/api/routines${query ? `?${query}` : ""}`
    );
    set({ routines: data, routinesPagination: pagination });
  },

  fetchRoutineById: async (id) => {
    set({ routineStatus: "loading" });
    try {
      const routine = await apiGet<Routine>(`/api/routines/${id}`);
      set({ routine, routineStatus: "loaded" });
    } catch (error) {
      const status =
        error instanceof Error && "status" in error && (error as { status?: number }).status === 404
          ? "not-found"
          : "error";
      set({ routineStatus: status });
    }
  },

  fetchLatestRoutine: async () => {
    try {
      const { data } = await apiGet<PaginatedResponse<RoutineSummary>>("/api/routines?pageSize=1");
      if (data && data.length > 0) {
        await get().fetchRoutineById(data[0].id);
        const loaded = get().routine;
        if (loaded.status === "ready" && get().chat.previewState === "chat-focus") {
          get().setPreviewState("docked");
        }
      }
    } catch (error) {
      console.error("Failed to fetch latest routine:", error);
    }
  },

  fetchSessionRoutine: async (chatSessionId) => {
    try {
      const { data } = await apiGet<PaginatedResponse<RoutineSummary>>(
        `/api/routines?pageSize=1&chatSessionId=${chatSessionId}`
      );
      if (data && data.length > 0) {
        await get().fetchRoutineById(data[0].id);
        const loaded = get().routine;
        if (loaded.status === "ready" && get().chat.previewState === "chat-focus") {
          get().setPreviewState("docked");
        } else if (loaded.status === "finalized") {
          get().setPreviewState("finalized");
        } else if (loaded.status === "forming") {
          get().setPreviewState("docked");
        }
      } else {
        set({ routine: emptyRoutine, routineStatus: "idle" });
        if (get().chat.previewState !== "chat-focus") {
          get().setPreviewState("chat-focus");
        }
      }
    } catch (error) {
      console.error("Failed to fetch session routine:", error);
    }
  },

  finalizeRoutine: async () => {
    const { routine } = get();
    if (!routine.id) return;
    const updated = await apiPatch<Routine>(`/api/routines/${routine.id}`, { action: "finalize" });
    set((s) => ({ routine: updated, chat: { ...s.chat, previewState: "finalized" } }));
  },

  deleteRoutine: async (id) => {
    try {
      await fetch(`/api/routines/${id}`, { method: "DELETE" });
      await get().fetchRoutines({ status: "finalized" });
    } catch (error) {
      console.error("Failed to delete routine:", error);
    }
  },
});
