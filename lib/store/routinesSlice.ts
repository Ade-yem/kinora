import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { Routine, RoutineSummary, ProgramSummary, Program, RoutineStatus } from "@/types";
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
  routines: ProgramSummary[];
  routinesPagination: PaginationMeta | null;
  sessionRoutines: RoutineSummary[];
  routine: Routine;
  routineStatus: "idle" | "loading" | "loaded" | "not-found" | "error";
  fetchRoutines: (params?: { page?: number; pageSize?: number; status?: RoutineStatus }) => Promise<void>;
  fetchRoutineById: (id: string) => Promise<void>;
  finalizeRoutine: () => Promise<void>;
  fetchLatestRoutine: () => Promise<void>;
  fetchSessionRoutine: (chatSessionId: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  switchDay: (dayIndex: number) => Promise<void>;
}

export const createRoutinesSlice: StateCreator<AppState, [], [], RoutinesSlice> = (set, get) => ({
  routines: [],
  routinesPagination: null,
  sessionRoutines: [],
  routine: emptyRoutine,
  routineStatus: "idle",

  fetchRoutines: async (params) => {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.pageSize) search.set("pageSize", String(params.pageSize));
    if (params?.status) search.set("status", params.status);

    const query = search.toString();
    const { data, pagination } = await apiGet<PaginatedResponse<ProgramSummary>>(
      `/api/programs${query ? `?${query}` : ""}`
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
      const { data } = await apiGet<PaginatedResponse<ProgramSummary>>("/api/programs?pageSize=50");
      if (data && data.length > 0) {
        const latestFinalized = data.find((r) => r.status === "finalized");
        if (!latestFinalized) {
          // If no programs are finalized, fetch details of the first program to get its first routine day
          const program = await apiGet<Program>(`/api/programs/${data[0].id}`);
          if (program.routines && program.routines.length > 0) {
            await get().fetchRoutineById(program.routines[0].id);
          }
          return;
        }

        // Fetch the detailed program
        const program = await apiGet<Program>(`/api/programs/${latestFinalized.id}`);
        const programRoutines = [...program.routines].sort((a, b) => a.dayIndex - b.dayIndex);

        // Find the first day without any logs (uncompleted)
        const nextRoutine = programRoutines.find((r) => !r.logs || r.logs.length === 0);
        if (nextRoutine) {
          await get().fetchRoutineById(nextRoutine.id);
        } else {
          // If all days are completed, reset back to Day 1
          const day1 = programRoutines.find((r) => r.dayIndex === 1) || programRoutines[0];
          await get().fetchRoutineById(day1.id);
        }

        const loaded = get().routine;
        if (loaded.status === "ready" && get().chat.previewState === "chat-focus") {
          get().setPreviewState("docked");
        }
      } else {
        set({ routine: emptyRoutine, routineStatus: "idle" });
      }
    } catch (error) {
      console.error("Failed to fetch latest routine:", error);
      set({ routineStatus: "error" });
    }
  },

  fetchSessionRoutine: async (chatSessionId) => {
    try {
      const { data } = await apiGet<PaginatedResponse<Program>>(
        `/api/programs?pageSize=50&chatSessionId=${chatSessionId}`
      );
      if (data && data.length > 0) {
        const activeProgram = data[0];
        set({ sessionRoutines: activeProgram.routines });

        const sorted = [...activeProgram.routines].sort((a, b) => a.dayIndex - b.dayIndex);
        const firstRoutine = sorted.find((r) => r.dayIndex === 1) || sorted[0];
        await get().fetchRoutineById(firstRoutine.id);

        const loaded = get().routine;
        if (loaded.status === "ready" && get().chat.previewState === "chat-focus") {
          get().setPreviewState("docked");
        } else if (loaded.status === "finalized") {
          get().setPreviewState("finalized");
        } else if (loaded.status === "forming") {
          get().setPreviewState("docked");
        }
      } else {
        set({ sessionRoutines: [], routine: emptyRoutine, routineStatus: "idle" });
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
    const programId = routine.programId || routine.id;
    if (!programId) return;

    await apiPatch<Program>(`/api/programs/${programId}`, { action: "finalize" });
    
    // Update local sessionRoutines status to finalized for matching items
    const updatedSessionRoutines = get().sessionRoutines.map((r) => ({
      ...r,
      status: "finalized" as const
    }));

    set((s) => ({
      routine: { ...s.routine, status: "finalized" },
      sessionRoutines: updatedSessionRoutines,
      chat: { ...s.chat, previewState: "finalized" }
    }));
  },

  deleteRoutine: async (id) => {
    try {
      await fetch(`/api/programs/${id}`, { method: "DELETE" });
      await get().fetchRoutines({ status: "finalized" });
    } catch (error) {
      console.error("Failed to delete program:", error);
    }
  },

  switchDay: async (dayIndex) => {
    const { sessionRoutines } = get();
    const summary = sessionRoutines.find((r) => r.dayIndex === dayIndex);
    if (summary) {
      await get().fetchRoutineById(summary.id);
    }
  },
});
