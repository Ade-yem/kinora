import { llmClient, DEEPSEEK_MODEL } from "@/lib/llm";
import { prisma } from "@/lib/db";
import {
  BodyRegion,
  TargetMuscleGroup,
  PrimaryExerciseClassification,
  Prisma,
  UserProfile,
} from "@/app/generated/prisma/client";

// Normalize target muscle groups to match database enums
export function normalizeMuscleGroup(m: string): TargetMuscleGroup | null {
  const normalized = m.toUpperCase().trim().replace(/\s+/g, "_");
  if (normalized === "CHEST") return TargetMuscleGroup.CHEST;
  if (normalized === "QUADS" || normalized === "QUADRICEPS") return TargetMuscleGroup.QUADRICEPS;
  if (normalized === "SHOULDER" || normalized === "SHOULDERS") return TargetMuscleGroup.SHOULDERS;
  if (normalized === "ABS" || normalized === "ABDOMINALS" || normalized === "ABDOMINAL") return TargetMuscleGroup.ABDOMINALS;
  if (normalized === "BACK") return TargetMuscleGroup.BACK;
  if (normalized === "GLUTE" || normalized === "GLUTES") return TargetMuscleGroup.GLUTES;
  if (normalized === "BICEP" || normalized === "BICEPS") return TargetMuscleGroup.BICEPS;
  if (normalized === "TRICEP" || normalized === "TRICEPS") return TargetMuscleGroup.TRICEPS;
  if (normalized === "CALVES" || normalized === "CALF") return TargetMuscleGroup.CALVES;
  if (normalized === "HAMSTRING" || normalized === "HAMSTRINGS") return TargetMuscleGroup.HAMSTRINGS;
  if (normalized === "FOREARM" || normalized === "FOREARMS") return TargetMuscleGroup.FOREARMS;
  if (normalized === "TRAPS" || normalized === "TRAPEZIUS") return TargetMuscleGroup.TRAPEZIUS;

  const validGroups = Object.values(TargetMuscleGroup);
  if (validGroups.includes(normalized as TargetMuscleGroup)) {
    return normalized as TargetMuscleGroup;
  }
  return null;
}

// Search tool helper for Generator
export interface ExerciseCandidate {
  exerciseId: string;
  sets: number;
  targetReps: number | null;
  targetSeconds: number | null;
  targetSide: string | null;
}

export interface RoutineCandidate {
  title: string;
  subtitle: string;
  dayIndex: number;
  totalDays: number;
  exercises: ExerciseCandidate[];
}

export interface ProgramCandidate {
  programTitle: string;
  routines: RoutineCandidate[];
}

interface FilterSet {
  slotLabel?: string;
  muscles?: string[];
  equipment?: string[];
  classification?: string;
  bodyRegion?: string;
  posture?: string;
  movementPattern?: string;
  laterality?: string;
  difficultyLevel?: string;
  limit?: number;
}

interface BatchedSearchExercisesArgs {
  slots: FilterSet[];
}

export const getExercisesToolDefinition = {
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
                description: "A label describing the role of this exercise slot (e.g. 'Primary Squat', 'Upper Chest Push', 'Core Flexion')."
              },
              muscles: {
                type: "array",
                items: { type: "string" },
                description: "Muscle names (e.g. QUADRICEPS, SHOULDERS, GLUTES, CHEST)."
              },
              equipment: {
                type: "array",
                items: { type: "string" },
                description: "Equipment required (e.g. Dumbbell, Barbell, Bodyweight)."
              },
              classification: {
                type: "string",
                description: "Primary exercise classification (e.g. BODYBUILDING, CALISTHENICS)."
              },
              bodyRegion: {
                type: "string",
                description: "Body region (e.g. LOWER_BODY, UPPER_BODY, CORE)."
              },
              posture: {
                type: "string",
                description: "Posture filter (e.g. Standing, Supine, Seated)."
              },
              movementPattern: {
                type: "string",
                description: "Movement pattern query matching movementPattern1/2/3."
              },
              laterality: {
                type: "string",
                description: "Laterality filter (e.g. Unilateral, Bilateral)."
              },
              difficultyLevel: {
                type: "string",
                description: "Optional difficulty level. WARNING: Do not pass this parameter unless the user explicitly requests a specific difficulty, as it excessively narrows results."
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

// Search tool helper for Generator
export async function getExercisesByParametersInternal(argsJson: string) {
  let args: BatchedSearchExercisesArgs;
  try {
    args = JSON.parse(argsJson) as BatchedSearchExercisesArgs;
  } catch {
    return { error: "invalid arguments" };
  }

  const { slots } = args;
  if (!slots || !Array.isArray(slots)) {
    return { error: "slots is required and must be an array" };
  }

  // Enforce a hard ceiling of 8 slots per call
  const boundedSlots = slots.slice(0, 8);
  const slotResults = [];

  for (const slot of boundedSlots) {
    const {
      slotLabel = "unspecified",
      muscles,
      equipment,
      classification,
      bodyRegion,
      posture,
      movementPattern,
      laterality,
      difficultyLevel,
      limit = 10,
    } = slot;

    const andConditions: Prisma.ExerciseWhereInput[] = [];

    if (muscles) {
      const muscleArray = Array.isArray(muscles) ? muscles : [muscles];
      if (muscleArray.length > 0) {
        const muscleConditions = muscleArray.map((m: string) => {
          const enumVal = normalizeMuscleGroup(m);
          const orConditions: Prisma.ExerciseWhereInput[] = [
            { primeMoverMuscle: { contains: m, mode: "insensitive" } },
            { secondaryMuscle: { contains: m, mode: "insensitive" } },
          ];
          if (enumVal) {
            orConditions.push({ targetMuscleGroup: enumVal });
          }
          return { OR: orConditions };
        });
        andConditions.push({ OR: muscleConditions });
      }
    }

    if (equipment) {
      const eqArray = Array.isArray(equipment) ? equipment : [equipment];
      if (eqArray.length > 0) {
        andConditions.push({
          OR: eqArray.map((eq: string) => ({
            primaryEquipment: { contains: eq, mode: "insensitive" },
          })),
        });
      }
    }

    if (classification) {
      const enumVal = classification.toUpperCase().replace(/\s+/g, "_") as PrimaryExerciseClassification;
      if (Object.values(PrimaryExerciseClassification).includes(enumVal)) {
        andConditions.push({ primaryClassification: enumVal });
      }
    }

    if (bodyRegion) {
      const enumVal = bodyRegion.toUpperCase().replace(/\s+/g, "_") as BodyRegion;
      if (Object.values(BodyRegion).includes(enumVal)) {
        andConditions.push({ bodyRegion: enumVal });
      }
    }

    if (posture) {
      andConditions.push({ posture: { contains: posture, mode: "insensitive" } });
    }

    if (movementPattern) {
      andConditions.push({
        OR: [
          { movementPattern1: { contains: movementPattern, mode: "insensitive" } },
          { movementPattern2: { contains: movementPattern, mode: "insensitive" } },
          { movementPattern3: { contains: movementPattern, mode: "insensitive" } },
        ],
      });
    }

    if (laterality) {
      andConditions.push({ laterality: { contains: laterality, mode: "insensitive" } });
    }

    if (difficultyLevel) {
      andConditions.push({ difficultyLevel: { contains: difficultyLevel, mode: "insensitive" } });
    }

    const where: Prisma.ExerciseWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    try {
      console.log(`[Search DB] Slot: "${slotLabel}" constructed query where: ${JSON.stringify(where)}`);
      const exercises = await prisma.exercise.findMany({
        where,
        take: Math.min(limit, 20),
      });
      console.log(`[Search DB] Slot: "${slotLabel}" found ${exercises.length} exercises.`);

      slotResults.push({
        slotLabel,
        exercises: exercises.map(e => ({ id: e.id, name: e.name, primaryEquipment: e.primaryEquipment })),
      });
    } catch (error) {
      console.error(`[Search DB] Slot ${slotLabel} query failed:`, error);
      slotResults.push({
        slotLabel,
        error: error instanceof Error ? error.message : "Query failed",
      });
    }
  }

  return { slotResults };
}

const GENERATOR_SYSTEM_PROMPT = `You are a professional Personal Trainer and Workout Routine Generator Agent. Your job is to create structured, highly effective workout routines for a user based on their profile.

You MUST follow these rules:
1. Use the \`get_exercises_by_parameters\` tool to find REAL exercises in the database. Never invent exercise IDs. Call it in ONE turn with a list of all the \`slots\` you need for the routine (batching) to resolve routine generation in a single step.
2. Select exercises that match the user's available equipment and location. If the user works out at "Home" with "Dumbbells", only select bodyweight exercises or exercises requiring dumbbells.
3. Fit the number of exercises to the user's desired session duration:
   - 15-30 minutes: 3-4 exercises (approx. 9-12 total sets).
   - 45 minutes: 5-6 exercises (approx. 15-18 total sets).
   - 60+ minutes: 6-8 exercises (approx. 18-24 total sets).
4. Apply the following safety reasoning to avoid aggravating the user's injuries (exclude appropriate patterns/postures based on active or recovering injuries):
   - Knee Pain/Injury: Avoid Knee Dominant movements (exclude \`movementPattern: "Knee Dominant"\`).
   - Lower Back Pain/Injury: Avoid Rotational and Hip Hinge patterns (exclude \`movementPattern: "Rotational"\` or \`movementPattern: "Hip Hinge"\`). Prefer Supine (\`posture: "Supine"\`) or Seated (\`posture: "Seated"\`) postures.
   - Shoulder/Rotator Cuff Stiffness or Pain: Avoid overhead movements (exclude \`movementPattern: "Vertical Push"\` for upper body movements).
5. Output your final response as a JSON object inside a \`\`\`json \`\`\` block matching this format:
{
  "programTitle": "Overall program title (e.g. 7-Day Abs, Shoulders & Core)",
  "routines": [
    {
      "title": "Day title (e.g. Day 1: Core Foundation)",
      "subtitle": "Short descriptive subtitle of the routine focus",
      "dayIndex": 1,          // integer for the day index in program (e.g. 1)
      "totalDays": 3,         // integer for total days in program (e.g. 3)
      "exercises": [
        {
          "exerciseId": "exact_exercise_id_from_tool_call",
          "sets": 3,
          "targetReps": 10,       // integer number of reps, OR null if time-based
          "targetSeconds": null,  // integer number of seconds, OR null if rep-based
          "targetSide": null      // "per-side" if unilateral (e.g. single-leg split squat), OR null
        }
      ]
    }
  ]
}
6. Do NOT pass the \`difficultyLevel\` parameter in your search slots unless the user explicitly requests a specific difficulty level. Leave it undefined so you retrieve all matching exercises across all difficulty levels, preventing empty search results.

Available search parameters for get_exercises_by_parameters:
- posture: "Supine", "Bridge", "Quadruped", "Seated Floor", "Hanging", "Prone", "Side Plank", "Kneeling", "Seated", "Standing", "Half Kneeling", "Staggered Stance", "Split Squat", "Single Leg Standing", "Single Leg Supported"
- difficultyLevel: "Novice", "Beginner", "Intermediate", "Advanced", "Expert"
- laterality: "Unilateral", "Bilateral", "Contralateral", "Ipsilateral"
- movementPattern: "Anti-Extension", "Hip Extension", "Anti-Rotational", "Rotational", "Spinal Flexion", "Horizontal Push", "Hip Flexion", "Lateral Flexion", "Anti-Lateral Flexion", "Horizontal Pull", "Locomotion", "Vertical Pull", "Vertical Push", "Hip Hinge", "Knee Dominant"
`;

const REVIEWER_SYSTEM_PROMPT = `You are a strict, professional Kinesiologist and Workout Reviewer Agent. Your job is to analyze a candidate workout routine and determine if it is:
1. Safe for the user based on their injuries and notes.
2. Logistically possible (e.g., does not require equipment the user does not have).
3. Appropriate in volume (sets, exercises) for their desired session duration.
4. Structurally sound (e.g. good selection of exercises, appropriate sequencing).

You must reply with a JSON object ONLY containing:
{
  "status": "APPROVED" | "REJECTED",
  "reviewNotes": "If REJECTED, provide detailed feedback on what needs to be changed (e.g., 'Deadlifts are unsafe for lower back pain. Replace with Bird-Dogs. User does not have a pull-up bar, replace Pull-ups with Dumbbell Rows.'). If APPROVED, this can be empty."
}

Do not include any other conversational text.`;

interface SafeToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

async function runGenerator(
  biodataText: string,
  locationText: string,
  equipmentText: string,
  durationText: string,
  injuriesText: string,
  feedbackLoopNotes: string | null,
  onProgress: (text: string) => void,
  feedback?: string,
  currentRoutineContext?: string
): Promise<string> {
  const messages: {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_calls?: {
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: string;
      };
    }[];
    tool_call_id?: string;
  }[] = [
    { role: "system", content: GENERATOR_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Please generate/modify a workout routine for the following profile:
- Biological Data:
${biodataText}
- Session Location: ${locationText}
- Session Available Equipment: ${equipmentText}
- Session Duration: ${durationText}
- Active Injuries/Safety Notes:
${injuriesText}
${currentRoutineContext ? `\n${currentRoutineContext}` : ""}
${feedback ? `\nUser's Requested Modification: "${feedback}"` : ""}
${feedbackLoopNotes ? `\nFeedback from Reviewer/Previous attempt:\n${feedbackLoopNotes}` : ""}`,
    },
  ];

  let turn = 0;
  while (turn < 5) {
    const completion = await llmClient.chat.completions.create({
      model: DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: messages as unknown as Parameters<typeof llmClient.chat.completions.create>[0]["messages"],
      tools: [getExercisesToolDefinition],
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls = message.tool_calls as unknown as SafeToolCall[];
      messages.push({
        role: "assistant",
        content: message.content || "",
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      });
      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "get_exercises_by_parameters") {
          let numSlots = 0;
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments);
            numSlots = parsedArgs.slots?.length || 0;
          } catch {}
          onProgress(`[Generator] Searching exercises for ${numSlots} routine slots...\n`);
          const result = await getExercisesByParametersInternal(toolCall.function.arguments);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
      }
      turn++;
    } else {
      return message.content || "";
    }
  }

  throw new Error("Generator exceeded max turns without outputting a routine");
}

async function runReviewer(
  biodataText: string,
  locationText: string,
  equipmentText: string,
  durationText: string,
  injuriesText: string,
  candidateRoutine: ProgramCandidate,
  onProgress: (text: string) => void,
  currentRoutineContext?: string
): Promise<{ status: "APPROVED" | "REJECTED"; reviewNotes: string }> {
  onProgress(`[Reviewer] Reviewing routine candidate...\n`);

  const messages = [
    { role: "system" as const, content: REVIEWER_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `User Profile & Session Details:
- Biological Data:
${biodataText}
- Session Location: ${locationText}
- Session Available Equipment: ${equipmentText}
- Session Duration: ${durationText}
- Active Injuries/Safety Notes:
${injuriesText}

${currentRoutineContext ? `Active Program/Routines before refinement:\n${currentRoutineContext}\n` : ""}
Candidate Routine:
${JSON.stringify(candidateRoutine, null, 2)}`,
    },
  ];

  const completion = await llmClient.chat.completions.create({
    model: DEEPSEEK_MODEL || "deepseek-v4-flash",
    messages,
  });

  const content = completion.choices[0].message.content || "";
  try {
    const parsed = extractJson(content) as { status: string; reviewNotes?: string };
    return {
      status: parsed.status === "APPROVED" ? "APPROVED" : "REJECTED",
      reviewNotes: parsed.reviewNotes || "",
    };
  } catch {
    throw new Error(`Reviewer output was not valid JSON: ${content}`);
  }
}

export function extractJson(text: string): unknown {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonBlockRegex);
  const jsonText = match ? match[1] : text;
  try {
    return JSON.parse(jsonText.trim());
  } catch (e) {
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(jsonText.substring(firstBrace, lastBrace + 1));
      } catch {
        throw new Error(`Failed to parse JSON: ${(e as Error).message}`);
      }
    }
    throw new Error(`Failed to parse JSON: ${(e as Error).message}`);
  }
}

async function saveRoutineToDb({
  userId,
  chatSessionId,
  routineData,
  status,
  reviewNotes,
}: {
  userId: string;
  chatSessionId: string;
  routineData: ProgramCandidate;
  status: "APPROVED" | "REJECTED";
  reviewNotes?: Prisma.InputJsonValue | null;
}) {
  const routinesList = routineData.routines || [];
  const programTitle = routineData.programTitle || "My Workout Program";

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let programId: string | null = null;
    if (routinesList.length > 1) {
      const existingWithProgram = await tx.workoutRoutine.findFirst({
        where: { chatSessionId, NOT: { programId: null } },
        select: { programId: true },
      });
      programId = existingWithProgram?.programId || `prog_${Math.random().toString(36).substring(2, 11)}`;
    }

    const savedRoutines = [];
    const totalDays = routinesList.length;

    for (const rData of routinesList) {
      const title = rData.title || programTitle;
      const subtitle = rData.subtitle || "";
      const exercises = rData.exercises || [];
      const dayIndex = rData.dayIndex ? Number(rData.dayIndex) : 1;

      const existingRoutine = await tx.workoutRoutine.findFirst({
        where: { chatSessionId, dayIndex },
      });

      let routine;
      const dbReviewNotes = (reviewNotes !== undefined && reviewNotes !== null)
        ? (reviewNotes as Prisma.InputJsonValue)
        : (status === "REJECTED"
          ? ({ error: "Rejected by reviewer" } as Prisma.InputJsonValue)
          : Prisma.DbNull);

      if (existingRoutine) {
        routine = await tx.workoutRoutine.update({
          where: { id: existingRoutine.id },
          data: {
            title,
            subtitle,
            status,
            reviewNotes: dbReviewNotes,
            dayIndex,
            totalDays,
            programId,
          },
        });

        await tx.routineItem.deleteMany({
          where: { routineId: existingRoutine.id },
        });
      } else {
        routine = await tx.workoutRoutine.create({
          data: {
            userId,
            chatSessionId,
            title,
            subtitle,
            status,
            reviewNotes: dbReviewNotes,
            dayIndex,
            totalDays,
            programId,
          },
        });
      }

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await tx.routineItem.create({
          data: {
            routineId: routine.id,
            exerciseId: ex.exerciseId,
            order: i + 1,
            sets: Number(ex.sets) || 3,
            targetReps: ex.targetReps !== null && ex.targetReps !== undefined ? Number(ex.targetReps) : null,
            targetSeconds: ex.targetSeconds !== null && ex.targetSeconds !== undefined ? Number(ex.targetSeconds) : null,
            targetSide: ex.targetSide || null,
          },
        });
      }
      savedRoutines.push(routine);
    }

    await tx.workoutRoutine.deleteMany({
      where: {
        chatSessionId,
        dayIndex: { gt: totalDays },
      },
    });

    const session = await tx.chatSession.findUnique({
      where: { id: chatSessionId },
      select: { title: true },
    });
    if (session && (!session.title || session.title === "New Chat" || session.title.trim() === "")) {
      await tx.chatSession.update({
        where: { id: chatSessionId },
        data: { title: programTitle },
      });
    }

    return savedRoutines[0] || null;
  });
}

export async function runRoutineGenerationLoop({
  userId,
  chatSessionId,
  onProgress,
  feedback,
}: {
  userId: string;
  chatSessionId: string;
  onProgress: (text: string) => void;
  feedback?: string;
}) {
  onProgress("[System] Starting routine generator loop...\n");

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

  let routineContext = "";
  if (feedback) {
    const activeRoutines = await prisma.workoutRoutine.findMany({
      where: { chatSessionId, status: "APPROVED" },
      orderBy: { dayIndex: "asc" },
      include: {
        items: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (activeRoutines.length > 0) {
      routineContext = `\nActive Program Routines to modify:\n`;
      for (const routine of activeRoutines) {
        routineContext += `Day ${routine.dayIndex || 1}: ${routine.title} (ID: ${routine.id})\n`;
        if (routine.subtitle) {
          routineContext += `Subtitle: ${routine.subtitle}\n`;
        }
        routineContext += `Exercises:\n`;
        routine.items.forEach((item: { exercise: { name: string }; exerciseId: string; sets: number; targetReps: number | null; targetSeconds: number | null }) => {
          routineContext += `  - ${item.exercise.name} (ID: ${item.exerciseId}) - ${item.sets} sets x ${item.targetReps ?? item.targetSeconds ?? 10} reps/secs\n`;
        });
        routineContext += `\n`;
      }
    }
  }

  let attempt = 0;
  let feedbackNotes: string | null = null;
  let candidateRoutine: ProgramCandidate | null = null;

  while (attempt < 3) {
    attempt++;
    console.log(JSON.stringify({ event: "routine_gen_attempt", userId, chatSessionId, attempt }));
    onProgress(`\n[System] Actor-Critic loop iteration ${attempt}...\n`);

    try {
      const generatorOutput = await runGenerator(
        biodataText,
        locationText,
        equipmentText,
        durationText,
        injuriesText,
        feedbackNotes,
        onProgress,
        feedback,
        routineContext
      );
      candidateRoutine = extractJson(generatorOutput) as ProgramCandidate;
      onProgress(`[Generator] Routine candidate proposed: "${candidateRoutine.programTitle || "Workout Program"}"\n`);
    } catch (e) {
      console.log(JSON.stringify({ event: "routine_gen_outcome", userId, chatSessionId, attempt, outcome: "generator_error" }));
      onProgress(`[Generator] Error: ${(e as Error).message}. Retrying...\n`);
      feedbackNotes = `Previous generation failed: ${(e as Error).message}`;
      continue;
    }

    // Run Reviewer (Critic)
    try {
      const reviewResult = await runReviewer(
        biodataText,
        locationText,
        equipmentText,
        durationText,
        injuriesText,
        candidateRoutine,
        onProgress,
        routineContext
      );
      if (reviewResult.status === "APPROVED") {
        onProgress(`[Reviewer] APPROVED! Saving routine...\n`);
        
        const routine = await saveRoutineToDb({
          userId,
          chatSessionId,
          routineData: candidateRoutine,
          status: "APPROVED",
        });

        if (!routine) {
          throw new Error("Routine could not be saved to database");
        }

        onProgress(`[System] Routine saved with ID: ${routine.id}\n`);
        console.log(JSON.stringify({ event: "routine_gen_outcome", userId, chatSessionId, attempt, outcome: "approved" }));
        return routine;
      } else {
        onProgress(`[Reviewer] REJECTED because: ${reviewResult.reviewNotes}\n`);
        feedbackNotes = reviewResult.reviewNotes;
      }
    } catch (e) {
      console.log(JSON.stringify({ event: "routine_gen_outcome", userId, chatSessionId, attempt, outcome: "reviewer_error" }));
      onProgress(`[Reviewer] Error: ${(e as Error).message}. Retrying...\n`);
      feedbackNotes = `Previous review failed: ${(e as Error).message}`;
    }
  }

  // If we reach here, we failed to get approval after 3 attempts.
  // Save as REJECTED so we have it on record.
  if (candidateRoutine) {
    onProgress(`[System] Reviewer rejected all candidates. Saving final routine as REJECTED.\n`);
    const routine = await saveRoutineToDb({
      userId,
      chatSessionId,
      routineData: candidateRoutine,
      status: "REJECTED",
      reviewNotes: feedbackNotes ? { feedback: feedbackNotes } : null,
    });
    if (!routine) {
      throw new Error("Routine could not be saved to database");
    }
    console.log(JSON.stringify({ event: "routine_gen_outcome", userId, chatSessionId, attempt, outcome: "rejected_exhausted" }));
    return routine;
  }

  console.log(JSON.stringify({ event: "routine_gen_outcome", userId, chatSessionId, attempt, outcome: "rejected_exhausted" }));
  throw new Error("Routine generation failed to produce a candidate routine");
}
