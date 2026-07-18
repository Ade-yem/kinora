import { describe, it, expect } from "vitest";
import {
  locationToApi,
  locationFromApi,
  chatRoleToApi,
  chatMessageKindToApi,
  routineStatusToApi,
  mapRoutineItemToExercise,
} from "@/lib/api/mappers";

describe("API Mappers", () => {
  describe("locationToApi", () => {
    it("should map HOME and GYM to lowercase, and null to null", () => {
      expect(locationToApi("HOME")).toBe("home");
      expect(locationToApi("GYM")).toBe("gym");
      expect(locationToApi(null)).toBeNull();
    });
  });

  describe("locationFromApi", () => {
    it("should map lowercase home/gym to uppercase, and null to null", () => {
      expect(locationFromApi("home")).toBe("HOME");
      expect(locationFromApi("gym")).toBe("GYM");
      expect(locationFromApi(null)).toBeNull();
    });
  });

  describe("chatRoleToApi", () => {
    it("should map COACH and USER to lowercase", () => {
      expect(chatRoleToApi("COACH")).toBe("coach");
      expect(chatRoleToApi("USER")).toBe("user");
    });
  });

  describe("chatMessageKindToApi", () => {
    it("should map TEXT, GUARDRAIL, and PATCH correctly", () => {
      expect(chatMessageKindToApi("TEXT")).toBe("text");
      expect(chatMessageKindToApi("GUARDRAIL")).toBe("guardrail");
      expect(chatMessageKindToApi("PATCH")).toBe("patch");
    });
  });

  describe("routineStatusToApi", () => {
    it("should map APPROVED status based on finalizedAt timestamp, even if itemCount is 0", () => {
      const now = new Date();
      expect(routineStatusToApi("APPROVED", now, 0)).toBe("finalized");
      expect(routineStatusToApi("APPROVED", null, 0)).toBe("ready");
      expect(routineStatusToApi("APPROVED", now, 5)).toBe("finalized");
    });

    it("should return empty if itemCount is 0 and status is not APPROVED", () => {
      expect(routineStatusToApi("PENDING_GENERATION", null, 0)).toBe("empty");
    });

    it("should return forming if status is pending/rejected and itemCount > 0", () => {
      expect(routineStatusToApi("PENDING_GENERATION", null, 3)).toBe("forming");
      expect(routineStatusToApi("PENDING_REVIEW", null, 2)).toBe("forming");
      expect(routineStatusToApi("REJECTED", null, 1)).toBe("forming");
    });
  });

  describe("mapRoutineItemToExercise", () => {
    it("should map database routine item structure to frontend format", () => {
      const dbItem = {
        exercise: {
          id: "ex_1",
          name: "Push Up",
          primeMoverMuscle: "Chest",
          primaryEquipment: "Bodyweight",
          shortDemoVideoUrl: "https://demo.com/pushup",
        },
        sets: 3,
        targetReps: 12,
        targetSeconds: null,
        targetSide: "per-side",
      };

      const mapped = mapRoutineItemToExercise(dbItem);
      expect(mapped).toEqual({
        id: "ex_1",
        name: "Push Up",
        muscle: "Chest",
        equipment: "Bodyweight",
        sets: 3,
        target: {
          reps: 12,
          side: "per-side",
        },
        shortDemoVideoUrl: "https://demo.com/pushup",
      });
    });

    it("should fallback to 10 reps if targetReps and targetSeconds are null", () => {
      const dbItem = {
        exercise: {
          id: "ex_2",
          name: "Plank",
          primeMoverMuscle: "Core",
          primaryEquipment: "Bodyweight",
          shortDemoVideoUrl: null,
        },
        sets: 2,
        targetReps: null,
        targetSeconds: null,
        targetSide: null,
      };

      const mapped = mapRoutineItemToExercise(dbItem);
      expect(mapped.target).toEqual({ reps: 10 });
    });
  });
});
