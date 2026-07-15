import type { RoutineExercise, RoutineStatus as FrontendRoutineStatus } from "@/lib/types";

// DB enum to frontend union mappings
const LOCATION_TO_API: Record<string, string> = {
  HOME: "home",
  GYM: "gym",
};

const LOCATION_FROM_API: Record<string, string> = {
  home: "HOME",
  gym: "GYM",
};

export function locationToApi(location: string | null): string | null {
  return location ? LOCATION_TO_API[location] : null;
}

export function locationFromApi(location: string | null): string | null {
  return location ? LOCATION_FROM_API[location] ?? null : null;
}

export function chatRoleToApi(role: "COACH" | "USER"): "coach" | "user" {
  return role === "COACH" ? "coach" : "user";
}

export function chatMessageKindToApi(
  kind: "TEXT" | "GUARDRAIL" | "PATCH"
): "text" | "guardrail" | "patch" {
  return kind === "GUARDRAIL" ? "guardrail" : kind === "PATCH" ? "patch" : "text";
}

export function routineStatusToApi(
  status: string,
  finalizedAt: Date | null,
  itemCount: number
): FrontendRoutineStatus {
  if (itemCount === 0) {
    return "empty";
  }

  if (
    status === "PENDING_GENERATION" ||
    status === "PENDING_REVIEW" ||
    status === "REJECTED"
  ) {
    return "forming";
  }

  if (status === "APPROVED") {
    return finalizedAt ? "finalized" : "ready";
  }

  return "empty";
}

export function mapRoutineItemToExercise(
  item: any
): RoutineExercise {
  return {
    id: item.exercise.id,
    name: item.exercise.name,
    muscle: item.exercise.primeMoverMuscle ?? "",
    equipment: item.exercise.primaryEquipment ?? "",
    sets: item.sets,
    target:
      item.targetReps !== null
        ? {
            reps: item.targetReps,
            side: item.targetSide ?? undefined,
          }
        : item.targetSeconds !== null
          ? { seconds: item.targetSeconds }
          : { reps: 10 },
  };
}
