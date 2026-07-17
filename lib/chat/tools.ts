import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { locationFromApi, locationToApi } from "@/lib/api/mappers";
import { ProfileUpdateSchema } from "@/lib/validation/profile";
import { getExercisesByParametersInternal, runRoutineGenerationLoop } from "./generator";

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Read back the user's previously confirmed training profile (goal, location, equipment, session duration, injuries). Call this silently at the start of your reasoning so you don't re-ask for fields already known.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user_profile",
      description:
        "Persist training profile fields the user has just explicitly confirmed. Only pass fields that were actually stated this conversation — never invent values.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The user's fitness goal, in their own words." },
          location: { type: "string", enum: ["home", "gym"], description: "Where the user trains." },
          equipment: {
            type: "array",
            items: { type: "string" },
            description: "Equipment the user has available, in their own words.",
          },
          sessionDurationMinutes: {
            type: "number",
            description: "How many minutes the user wants a session to last.",
          },
          injuriesNotes: {
            type: "string",
            description: "Free-text notes on any injuries, pain, or physical limitations the user mentioned.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_exercises_by_parameters",
      description:
        "Search the exercise database for exercises matching target muscle groups, body regions, classification, search terms, and available equipment.",
      parameters: {
        type: "object",
        properties: {
          muscles: {
            type: "array",
            items: { type: "string" },
            description:
              "List of target muscle groups to filter by (e.g. QUADRICEPS, SHOULDERS, ABDOMINALS, BACK, GLUTES, CHEST, BICEPS, TRICEPS, HIP_FLEXORS, CALVES, HAMSTRINGS, FOREARMS, ABDUCTORS, ADDUCTORS, TRAPEZIUS, SHINS).",
          },
          equipment: {
            type: "array",
            items: { type: "string" },
            description:
              "List of available equipment items to filter by (e.g. Dumbbell, Barbell, Bodyweight, Cable, Kettlebell, Band, Machine, Bench, Pull-up Bar).",
          },
          classification: {
            type: "string",
            description:
              "Primary exercise classification (e.g. BODYBUILDING, CALISTHENICS, BALLISTICS, BALANCE, PLYOMETRIC, OLYMPIC_WEIGHTLIFTING, MOBILITY, GRINDS, POSTURAL, ANIMAL_FLOW, POWERLIFTING, UNSORTED).",
          },
          bodyRegion: {
            type: "string",
            description: "Body region (e.g. LOWER_BODY, UPPER_BODY, FULL_BODY, CORE).",
          },
          search: {
            type: "string",
            description: "A search string to match against exercise names (e.g. push-up, bench press).",
          },
          limit: {
            type: "number",
            description: "The maximum number of exercises to return. Defaults to 20.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "retrieve_user_safety_profile",
      description:
        "Pulls safety variables, injuries and physical limitations of the user for double-checking against candidate workouts.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_workout_routine",
      description:
        "Triggers the Actor-Critic Generator/Reviewer routine-generation loop to create a workout routine for the user. Call this only when location, equipment, and session duration are confirmed.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

async function getUserProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    return { found: false };
  }

  return {
    found: true,
    goal: profile.goal,
    location: locationToApi(profile.location),
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    injuriesNotes: profile.injuriesNotes,
    injuries: profile.injuries,
  };
}

async function updateUserProfile(userId: string, argsJson: string) {
  let args: unknown;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const parsed = ProfileUpdateSchema.safeParse(args);
  if (!parsed.success) {
    return { error: "invalid arguments", details: parsed.error.flatten() };
  }

  const { goal, location, equipment, sessionDurationMinutes, injuriesNotes } = parsed.data;

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      goal,
      location: location ? locationFromApi(location) : undefined,
      equipment,
      sessionDurationMinutes,
      injuriesNotes,
    },
  });

  return {
    saved: true,
    goal: profile.goal,
    location: locationToApi(profile.location),
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    injuriesNotes: profile.injuriesNotes,
  };
}

async function retrieveUserSafetyProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      injuries: true,
      injuriesNotes: true,
    },
  });
  return profile || { injuries: null, injuriesNotes: null };
}

async function generateWorkoutRoutine(
  userId: string,
  chatSessionId: string,
  onProgress: (text: string) => void
) {
  try {
    const routine = await runRoutineGenerationLoop({
      userId,
      chatSessionId,
      onProgress,
    });
    return {
      success: true,
      routineId: routine.id,
      title: routine.title,
      subtitle: routine.subtitle,
      status: routine.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate routine",
    };
  }
}

export async function executeToolCall(
  name: string,
  argsJson: string,
  userId: string,
  chatSessionId: string,
  onProgress: (text: string) => void
): Promise<unknown> {
  if (name === "get_user_profile") {
    return getUserProfile(userId);
  }
  if (name === "update_user_profile") {
    return updateUserProfile(userId, argsJson);
  }
  if (name === "get_exercises_by_parameters") {
    return getExercisesByParametersInternal(argsJson);
  }
  if (name === "retrieve_user_safety_profile") {
    return retrieveUserSafetyProfile(userId);
  }
  if (name === "generate_workout_routine") {
    return generateWorkoutRoutine(userId, chatSessionId, onProgress);
  }
  return { error: `unknown tool: ${name}` };
}
