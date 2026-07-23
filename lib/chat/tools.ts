import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { locationFromApi, locationToApi } from "@/lib/api/mappers";
import { getExercisesByParametersInternal, runReviewer, saveRoutineToDb, ProgramCandidate } from "./generator";
import { checkRoutineGenerationLimit } from "../rate-limit";


const getExercisesToolDefinition = {
  type: "function" as const,
  function: {
    name: "get_exercises_by_parameters",
    description: "Batch query the exercise database for multiple routine slots in a single turn. Each slot represents one exercise target.",
    parameters: {
      type: "object",
      properties: {
        slots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slotLabel: {
                type: "string",
                description: `A label describing the role of this exercise slot (e.g. 'Primary Squat', 'Upper Chest Push', 'Core Flexion').`
              },
              posture: {
                type: "string",
                description: `Posture filter: 
                Unique values posture include - 
                "Supine", "Bridge", "Quadruped", "Seated Floor", "Hanging", "Prone", "Knee Hover Quadruped", "Side Plank", "Kneeling", "Seated", "Standing", "L Sit", "Half Kneeling", "Staggered Stance", "Inverted", "Single Leg Bridge", "Side Lying", "Walking", "Wall Sit", "Single Leg Standing Bent Knee", "Tall Kneeling", "Split Squat", "Single Leg Standing", "Single Leg Supported", "Knee Over Toe Split Squat", "Tuck L Sit", "Other", "V Sit Seated", "Isometric Split Squat", "March", "Shin Box Seated", "Horse Stance", "Knee Supported", "Running"
                `
              },
              movementPattern: {
                type: "string",
                description: `Movement pattern during the exercise.
                Unique values for movement pattern parameter include:
                "Anti-Extension", "Hip Extension", "Anti-Rotational", "Rotational", "Spinal Flexion", "Horizontal Push",
                "Hip Flexion", "Lateral Flexion", "Anti-Lateral Flexion", "Horizontal Pull", "Locomotion", "Isometric Hold",
                "Vertical Pull", "Shoulder External Rotation", "Hip External Rotation", "Knee Dominant", "Vertical Push",
                "Hip Hinge", "Hip Abduction", "Scapular Elevation", "Elbow Flexion", "Elbow Extension", "Spinal Extension",
                "Loaded Carry", "Shoulder Flexion", "Other", "Shoulder Abduction", "Hip Dominant", "Ankle Plantar Flexion",
                "Hip Adduction", "Ankle Dorsiflexion", "Wrist Flexion", "Horizontal Adduction", "Wrist Extension",
                "Shoulder Internal Rotation", "Shoulder Scapular Plane Elevation", "Anti-Flexion", "Lateral Locomotion"
                `
              },
              muscles: {
                type: "array",
                items: { type: "string" },
                description: `Muscle groups targeted by the exercise. Unique values include:
                "Abdominals", "Glutes", "Chest", "Hip Flexors", "Shoulders", "Back", "Biceps", "Quadriceps",
                "Hamstrings", "Abductors", "Trapezius", "Triceps", "Forearms", "Calves", "Adductors", "Shins"
                `
              },
              bodyRegion: {
                type: "string",
                description: `Body region targeted by the exercise. Unique values include:
                "Lower Body", "Upper Body", "Core"
                `
              },
              difficultyLevel: {
                type: "string",
                description: `Optional difficulty level. WARNING: Do not pass this parameter unless the user explicitly
                requests a specific difficulty, as it excessively narrows results.
                Unique values for difficulty level parameter include:
                "Beginner", "Intermediate", "Novice", "Advanced", "Expert", "Grand Master", "Master", "Legendary"
                `
              },
              equipment: {
                type: "array",
                items: { type: "string" },
                description: `Equipment required for exercise routine
                Unique values include:
                "Stability Ball", "Bodyweight", "Gymnastic Rings", "Parallette Bars", "Slam Ball", "Dumbbell",
                "Ab Wheel", "Cable", "Medicine Ball", "Suspension Trainer", "Barbell", "Miniband", "Sliders",
                "Pull Up Bar", "EZ Bar", "Landmine", "Superband", "Kettlebell", "Resistance Band", "Weight Plate",
                "Macebell", "Indian Club", "Clubbell", "Tire", "Trap Bar", "Battle Ropes", "Bulgarian Bag", "Heavy Sandbag",
                "Sandbag", "Wall Ball", "Sled", "Climbing Rope"
                `
              },
              laterality: {
                type: "string",
                description: `Laterality filter (e.g. Unilateral, Bilateral). 
                Unique values include:
                "Unilateral", "Bilateral", "Contralateral", "Ipsilateral"
                `
              },
              limit: {
                type: "number",
                description: "Max results per slot (default 10)."
              }
            },
            additionalProperties: false
          },
          description: "List of routine slots to fill, up to a maximum of 8 slots."
        }
      },
      required: ["slots"],
      additionalProperties: false
    }
  }
};
export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Read back the user's durable biological profile (biodata, preferred location, etc.), active/recovering injuries, and active session intake options.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
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
      name: "propose_workout_routine",
      description:
        "Propose a candidate workout routine program to the Reviewer for validation and database persistence. Call this once you have selected matching exercises and built the program structure based on user preferences.",
      parameters: {
        type: "object",
        properties: {
          programTitle: {
            type: "string",
            description: "Overall program title (e.g., 'Back & Shoulders Focus').",
          },
          conversationSummary: {
            type: "string",
            description: "A summary of the user's goals, focus, routine length in days, and constraints (e.g., '7 days back and shoulders routine, bodyweight, 20 mins, beginner, pains or injuries if any').",
          },
          totalDays: {
            type: "integer",
            description: "Total days in the workout program split.",
          },
          routines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Title of the day's routine (e.g., 'Day 1: Back Strength')." },
                subtitle: { type: "string", description: "Focus of this day's routine." },
                dayIndex: { type: "integer", description: "Day number, starting from 1." },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      exerciseId: { type: "string", description: "Exact exercise ID from get_exercises_by_parameters." },
                      sets: { type: "integer", description: "Number of sets." },
                      targetReps: { type: "integer", description: "Target reps per set (or null if time-based)." },
                      targetSeconds: { type: "integer", description: "Target seconds per set (or null if rep-based)." },
                      targetSide: { type: "string", description: "Optional side target, e.g. 'per-side'." },
                    },
                    required: ["exerciseId", "sets"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "subtitle", "dayIndex", "exercises"],
              additionalProperties: false,
            },
          },
        },
        required: ["programTitle", "conversationSummary", "totalDays", "routines"],
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

  const activePrograms = await prisma.workoutProgram.findMany({
    where: {
      chatSessionId,
      status: "APPROVED",
    },
    include: {
      routines: true
    },
  });

  return {
    foundProfile: !!profile,
    // Biodata
    weight: profile?.weight ?? null,
    height: profile?.height ?? null,
    dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    biologicalSex: profile?.biologicalSex ?? null,
    experienceLevel: profile?.experienceLevel ?? null,
    defaultLocation: profile?.preferredLocation ? locationToApi(profile.preferredLocation) : null,
    unitsPreference: profile?.unitsPreference ?? "lb",
    // Session-scoped intake
    location: activeSession?.location ? locationToApi(activeSession.location) : null,
    equipment: activeSession?.equipment ?? [],
    sessionDurationMinutes: activeSession?.sessionDurationMinutes ?? null,
    // Current active prograns in DB
    activePrograms: activePrograms,
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

async function proposeWorkoutRoutine(
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

    let args: {
      programTitle?: string;
      conversationSummary?: string;
      totalDays?: number;
      routines?: ProgramCandidate["routines"];
    };
    try {
      args = JSON.parse(argsJson);
    } catch {
      return { error: "invalid arguments: not valid JSON" };
    }

    const { programTitle, conversationSummary, totalDays, routines } = args;
    if (!programTitle || !conversationSummary || !totalDays || !routines) {
      return { error: "Missing required fields: programTitle, conversationSummary, totalDays, routines" };
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new Error("User profile not found");
    }

    const activeSession = await prisma.chatSession.findUnique({
      where: { id: chatSessionId },
    });

    const activeInjuries = await prisma.injury.findMany({
      where: { userId, status: { in: ["ACTIVE", "RECOVERING"] } },
    });

    const biodataText = `
- Weight: ${profile.weight ? `${profile.weight} ${profile.unitsPreference}` : "Not specified"}
- Height: ${profile.height ? `${profile.height} ${profile.unitsPreference === "lb" ? "in" : "cm"}` : "Not specified"}
- Age/Date of Birth: ${profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : "Not specified"}
- Biological Sex: ${profile.biologicalSex || "Not specified"}
- Training Experience Level: ${profile.experienceLevel || "Not specified"}
- Preferred Location: ${profile.preferredLocation || "Not specified"}
`.trim();

    const locationText = activeSession?.location ? activeSession.location.toString().toLowerCase() : "Not specified";
    const equipmentText = activeSession?.equipment && activeSession.equipment.length > 0
      ? activeSession.equipment.join(", ")
      : "None";
    const durationText = activeSession?.sessionDurationMinutes
      ? `${activeSession.sessionDurationMinutes} minutes`
      : "45 minutes";

    const injuriesText = activeInjuries.length > 0
      ? activeInjuries.map((inj) => `- ${inj.bodyPart} (${inj.severity.toLowerCase()}): ${inj.note || "No details"}`).join("\n")
      : "None";

    const activeRoutines = await prisma.workoutRoutine.findMany({
      where: {
        program: {
          chatSessionId,
          status: "APPROVED",
        },
      },
      orderBy: { dayIndex: "asc" },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });

    let currentRoutineContext = "";
    if (activeRoutines.length > 0) {
      currentRoutineContext = `\nActive Program Routines to modify:\n`;
      for (const routine of activeRoutines) {
        currentRoutineContext += `Day ${routine.dayIndex || 1}: ${routine.title} (ID: ${routine.id})\n`;
        if (routine.subtitle) {
          currentRoutineContext += `Subtitle: ${routine.subtitle}\n`;
        }
        currentRoutineContext += `Exercises:\n`;
        routine.items.forEach((item) => {
          currentRoutineContext += `  - ${item.exercise.name} (ID: ${item.exerciseId}) - ${item.sets} sets x ${item.targetReps ?? item.targetSeconds ?? 10} reps/secs\n`;
        });
        currentRoutineContext += `\n`;
      }
    }

    const candidateRoutine: ProgramCandidate = {
      programTitle,
      totalDays: Number(totalDays),
      routines,
    };

    const reviewResult = await runReviewer(
      biodataText,
      locationText,
      equipmentText,
      durationText,
      injuriesText,
      candidateRoutine,
      onProgress,
      currentRoutineContext,
      conversationSummary
    );

    if (reviewResult.status === "APPROVED") {
      const routine = await saveRoutineToDb({
        userId,
        chatSessionId,
        routineData: candidateRoutine,
        status: "APPROVED",
      });

      if (!routine) {
        throw new Error("Routine could not be saved to database");
      }

      return {
        success: true,
        status: "APPROVED",
        routineId: routine.id,
        title: routine.title,
        subtitle: routine.subtitle,
      };
    } else {
      return {
        success: false,
        status: "REJECTED",
        reviewNotes: reviewResult.reviewNotes,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process proposed routine",
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
  if (name === "propose_workout_routine") {
    return proposeWorkoutRoutine(userId, chatSessionId, argsJson, onProgress);
  }
  return { error: `unknown tool: ${name}` };
}
