import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { locationFromApi, locationToApi } from "@/lib/api/mappers";
import { getExercisesByParametersInternal, runRoutineGenerationLoop, getExercisesToolDefinition } from "./generator";
import { checkRoutineGenerationLimit } from "../rate-limit";

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Read back the user's durable biological profile (biodata, preferred location, etc.), active/recovering injuries, and active session intake options. Call this silently at the start of your reasoning so you don't re-ask for fields already known.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user_biodata",
      description:
        "Persist biological facts and preferences for the user (weight, height, date of birth, biological sex, training experience, preferred location, units preference). Only pass fields that were actually stated this conversation — never invent values.",
      parameters: {
        type: "object",
        properties: {
          weight: { type: "number", description: "Weight in preferred units." },
          height: { type: "number", description: "Height in preferred units." },
          dateOfBirth: { type: "string", description: "Date of birth in YYYY-MM-DD format." },
          biologicalSex: { type: "string", description: "Biological sex (e.g. male, female)." },
          experienceLevel: { type: "string", description: "Training experience level (e.g. beginner, intermediate, advanced)." },
          preferredLocation: { type: "string", enum: ["home", "gym"], description: "Default location preference." },
          unitsPreference: { type: "string", enum: ["lb", "kg"], description: "Preferred unit system." },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_session_intake",
      description:
        "Persist session-scoped intake fields for the active chat session (location, equipment, session duration). Only pass fields that were actually stated this conversation — never invent values.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", enum: ["home", "gym"], description: "Where the user will train this session." },
          equipment: {
            type: "array",
            items: { type: "string" },
            description: "Equipment available for this session.",
          },
          sessionDurationMinutes: {
            type: "number",
            description: "How many minutes the user wants this session to last.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_injury",
      description: "Record a new injury, pain, or physical limitation mentioned by the user.",
      parameters: {
        type: "object",
        properties: {
          bodyPart: { type: "string", description: "The body part affected (e.g. knee, shoulder, lower back)." },
          severity: { type: "string", enum: ["mild", "moderate", "severe"], description: "The severity of the injury." },
          note: { type: "string", description: "Details about the pain or limitation." },
          onsetDate: { type: "string", description: "Approximate date of onset in YYYY-MM-DD format (optional)." },
        },
        required: ["bodyPart", "severity"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_injury_status",
      description: "Update the status of an existing injury (e.g. marking it recovering or resolved).",
      parameters: {
        type: "object",
        properties: {
          injuryId: { type: "string", description: "The unique ID of the injury." },
          status: { type: "string", enum: ["active", "recovering", "resolved"], description: "The new status of the injury." },
        },
        required: ["injuryId", "status"],
        additionalProperties: false,
      },
    },
  },
  getExercisesToolDefinition,
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
  {
    type: "function",
    function: {
      name: "modify_workout_routine",
      description:
        "Modify or refine the user's current workout routine based on their specific feedback (e.g. swap exercises, change equipment, add/remove movements).",
      parameters: {
        type: "object",
        properties: {
          feedback: {
            type: "string",
            description: "The user's requested adjustment (e.g., 'Swap rows for something else', 'Add weight lifting').",
          },
        },
        required: ["feedback"],
        additionalProperties: false,
      },
    },
  },
];

async function getUserProfile(userId: string, chatSessionId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const activeSession = await prisma.chatSession.findUnique({
    where: { id: chatSessionId },
    select: {
      location: true,
      equipment: true,
      sessionDurationMinutes: true,
    },
  });
  const activeInjuries = await prisma.injury.findMany({
    where: { userId, status: { in: ["ACTIVE", "RECOVERING"] } },
  });

  return {
    foundProfile: !!profile,
    // Biodata
    weight: profile?.weight ?? null,
    height: profile?.height ?? null,
    dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    biologicalSex: profile?.biologicalSex ?? null,
    experienceLevel: profile?.experienceLevel ?? null,
    preferredLocation: profile?.preferredLocation ? locationToApi(profile.preferredLocation) : null,
    unitsPreference: profile?.unitsPreference ?? "lb",
    // Session-scoped intake
    location: activeSession?.location ? locationToApi(activeSession.location) : null,
    equipment: activeSession?.equipment ?? [],
    sessionDurationMinutes: activeSession?.sessionDurationMinutes ?? null,
    // Safety
    injuries: activeInjuries.map((inj) => ({
      id: inj.id,
      bodyPart: inj.bodyPart,
      severity: inj.severity.toLowerCase(),
      note: inj.note,
      onsetDate: inj.onsetDate?.toISOString().slice(0, 10) ?? null,
      status: inj.status.toLowerCase(),
    })),
  };
}

async function updateUserBiodata(userId: string, argsJson: string) {
  let args: any;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const { weight, height, dateOfBirth, biologicalSex, experienceLevel, preferredLocation, unitsPreference } = args;

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      weight: weight !== undefined ? weight : undefined,
      height: height !== undefined ? height : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      biologicalSex: biologicalSex !== undefined ? biologicalSex : undefined,
      experienceLevel: experienceLevel !== undefined ? experienceLevel : undefined,
      preferredLocation: preferredLocation ? locationFromApi(preferredLocation) as any : undefined,
      unitsPreference: unitsPreference !== undefined ? unitsPreference : undefined,
    },
  });

  return {
    saved: true,
    weight: profile.weight,
    height: profile.height,
    dateOfBirth: profile.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    biologicalSex: profile.biologicalSex,
    experienceLevel: profile.experienceLevel,
    preferredLocation: profile.preferredLocation ? locationToApi(profile.preferredLocation) : null,
    unitsPreference: profile.unitsPreference,
  };
}

async function updateSessionIntake(chatSessionId: string, argsJson: string) {
  let args: any;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const { location, equipment, sessionDurationMinutes } = args;

  const session = await prisma.chatSession.update({
    where: { id: chatSessionId },
    data: {
      location: location ? locationFromApi(location) as any : undefined,
      equipment: equipment !== undefined ? equipment : undefined,
      sessionDurationMinutes: sessionDurationMinutes !== undefined ? sessionDurationMinutes : undefined,
    },
  });

  return {
    saved: true,
    location: session.location ? locationToApi(session.location) : null,
    equipment: session.equipment,
    sessionDurationMinutes: session.sessionDurationMinutes,
  };
}

async function addInjury(userId: string, argsJson: string) {
  let args: any;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const { bodyPart, severity, note, onsetDate } = args;

  const injury = await prisma.injury.create({
    data: {
      userId,
      bodyPart,
      severity: severity.toUpperCase(),
      note: note || null,
      onsetDate: onsetDate ? new Date(onsetDate) : null,
      status: "ACTIVE",
    },
  });

  return {
    saved: true,
    injuryId: injury.id,
    bodyPart: injury.bodyPart,
    severity: injury.severity.toLowerCase(),
    note: injury.note,
    onsetDate: injury.onsetDate?.toISOString().slice(0, 10) ?? null,
    status: injury.status.toLowerCase(),
  };
}

async function updateInjuryStatus(userId: string, argsJson: string) {
  let args: any;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const { injuryId, status } = args;

  const injury = await prisma.injury.update({
    where: { id: injuryId, userId },
    data: {
      status: status.toUpperCase() as any,
    },
  });

  return {
    updated: true,
    injuryId: injury.id,
    status: injury.status.toLowerCase(),
  };
}

async function retrieveUserSafetyProfile(userId: string) {
  const injuries = await prisma.injury.findMany({
    where: {
      userId,
      status: { in: ["ACTIVE", "RECOVERING"] },
    },
    select: {
      id: true,
      bodyPart: true,
      severity: true,
      note: true,
    },
  });
  return { injuries };
}

async function generateWorkoutRoutine(
  userId: string,
  chatSessionId: string,
  onProgress: (text: string) => void
) {
  try {
    const { success, retryAfterSeconds } = await checkRoutineGenerationLimit(userId);
    if (!success) {
      return {
        success: false,
        error: "rate_limited",
        retryAfterSeconds,
        userGuidance: `You can generate 5 routines per hour. Please try again in ${retryAfterSeconds} seconds.`
      };
    }

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

async function modifyWorkoutRoutine(
  userId: string,
  chatSessionId: string,
  argsJson: string,
  onProgress: (text: string) => void
) {
  try {
    const { success, retryAfterSeconds } = await checkRoutineGenerationLimit(userId);
    if (!success) {
      return {
        success: false,
        error: "rate_limited",
        retryAfterSeconds,
        userGuidance: `You can generate 5 routines per hour. Please try again in ${retryAfterSeconds} seconds.`
      };
    }
    
    let args: { feedback?: string };
    try {
      args = JSON.parse(argsJson) as { feedback?: string };
    } catch {
      return { error: "invalid arguments" };
    }
    const { feedback } = args;
    const routine = await runRoutineGenerationLoop({
      userId,
      chatSessionId,
      onProgress,
      feedback,
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
      error: error instanceof Error ? error.message : "Failed to modify routine",
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
    return getUserProfile(userId, chatSessionId);
  }
  if (name === "update_user_biodata") {
    return updateUserBiodata(userId, argsJson);
  }
  if (name === "update_session_intake") {
    return updateSessionIntake(chatSessionId, argsJson);
  }
  if (name === "add_injury") {
    return addInjury(userId, argsJson);
  }
  if (name === "update_injury_status") {
    return updateInjuryStatus(userId, argsJson);
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
  if (name === "modify_workout_routine") {
    return modifyWorkoutRoutine(userId, chatSessionId, argsJson, onProgress);
  }
  return { error: `unknown tool: ${name}` };
}
