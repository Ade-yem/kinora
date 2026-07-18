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

interface SearchExercisesArgs {
  muscles?: string[];
  equipment?: string[];
  classification?: string;
  bodyRegion?: string;
  search?: string;
  limit?: number;
}

// Search tool helper for Generator
export async function getExercisesByParametersInternal(argsJson: string) {
  let args: SearchExercisesArgs;
  try {
    args = JSON.parse(argsJson) as SearchExercisesArgs;
  } catch {
    return { error: "invalid arguments" };
  }

  const { muscles, equipment, classification, bodyRegion, search, limit = 20 } = args;
  const andConditions: Prisma.ExerciseWhereInput[] = [];

  if (search) {
    andConditions.push({ name: { contains: search, mode: "insensitive" } });
  }

  if (muscles && muscles.length > 0) {
    const muscleConditions = muscles.map((m: string) => {
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

  if (equipment && equipment.length > 0) {
    andConditions.push({
      OR: equipment.map((eq: string) => ({
        primaryEquipment: { contains: eq, mode: "insensitive" },
      })),
    });
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

  const where: Prisma.ExerciseWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  try {
    console.log(`[Search DB] Query arguments: muscles=${JSON.stringify(muscles)}, equipment=${JSON.stringify(equipment)}, search=${search}`);
    console.log(`[Search DB] Query WHERE clause: ${JSON.stringify(where)}`);
    const exercises = await prisma.exercise.findMany({
      where,
      select: {
        id: true,
        name: true,
        targetMuscleGroup: true,
        primeMoverMuscle: true,
        primaryEquipment: true,
        difficultyLevel: true,
      },
      take: Math.min(limit, 50),
    });
    console.log(`[Search DB] Found ${exercises.length} exercises matching criteria.`);

    return { exercises };
  } catch (error) {
    console.error(`[Search DB] Query failed:`, error);
    return { error: error instanceof Error ? error.message : "Failed to fetch exercises" };
  }
}

const GENERATOR_SYSTEM_PROMPT = `You are a professional Personal Trainer and Workout Routine Generator Agent. Your job is to create structured, highly effective workout routines for a user based on their profile.

You MUST follow these rules:
1. Use the \`get_exercises_by_parameters\` tool to find REAL exercises in the database. Never invent exercise IDs.
2. Select exercises that match the user's available equipment and location. If the user works out at "Home" with "Dumbbells", only select bodyweight exercises or exercises requiring dumbbells.
3. Fit the number of exercises to the user's desired session duration:
   - 15-30 minutes: 3-4 exercises (approx. 9-12 total sets).
   - 45 minutes: 5-6 exercises (approx. 15-18 total sets).
   - 60+ minutes: 6-8 exercises (approx. 18-24 total sets).
4. Do NOT include exercises that aggravate the user's listed injuries (e.g., no overhead press for shoulder pain, no heavy deadlifts/squats for lower back pain).
5. If a multi-day routine, split, or program is requested (e.g. 3-day split), generate one routine object per day in the \`routines\` array (with correct \`dayIndex\` and \`totalDays\`). You can designate recovery or rest days by providing an empty \`exercises\` array (\`"exercises": []\`) for that day, using a title like "Day 3: Rest & Recovery" and a brief subtitle. If an existing program is provided in the context, modify that program's daily routines to satisfy the user's requested adjustment. Keep unchanged exercises as they are (preserving their exerciseId and parameters), only replace, insert, or remove exercises as needed to address the feedback. Keep the overall duration, equipment limits, and injury notes in mind.
6. Output your final response as a JSON object inside a \`\`\`json \`\`\` block matching this format:
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
  userProfile: UserProfile,
  goal: string,
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
- Goal: ${userProfile.goal || "Not specified"}
- Location: ${userProfile.location || "Not specified"}
- Available Equipment: ${userProfile.equipment?.join(", ") || "None"}
- Session Duration: ${userProfile.sessionDurationMinutes || 45} minutes
- Injuries/Notes: ${userProfile.injuriesNotes || "None"}
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
      tools: [
        {
          type: "function",
          function: {
            name: "get_exercises_by_parameters",
            description: "Search the exercise database for exercises matching the criteria.",
            parameters: {
              type: "object",
              properties: {
                muscles: {
                  type: "array",
                  items: { type: "string" },
                  description: "Muscle names (e.g. CHEST, QUADS, GLUTES, TRICEPS)",
                },
                equipment: {
                  type: "array",
                  items: { type: "string" },
                  description: "Equipment (e.g. Dumbbell, Barbell, Bodyweight)",
                },
                classification: { type: "string" },
                bodyRegion: { type: "string" },
                search: { type: "string" },
                limit: { type: "number" },
              },
              additionalProperties: false,
            },
          },
        },
      ],
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
          onProgress(`[Generator] Searching exercises for muscles: ${JSON.parse(toolCall.function.arguments).muscles || "any"}...\n`);
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
  userProfile: UserProfile,
  candidateRoutine: ProgramCandidate,
  onProgress: (text: string) => void,
  currentRoutineContext?: string
): Promise<{ status: "APPROVED" | "REJECTED"; reviewNotes: string }> {
  onProgress(`[Reviewer] Reviewing routine candidate...\n`);

  const messages = [
    { role: "system" as const, content: REVIEWER_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `User Profile:
- Goal: ${userProfile.goal || "Not specified"}
- Location: ${userProfile.location || "Not specified"}
- Available Equipment: ${userProfile.equipment?.join(", ") || "None"}
- Session Duration: ${userProfile.sessionDurationMinutes || 45} minutes
- Injuries/Notes: ${userProfile.injuriesNotes || "None"}

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
        profile,
        profile.goal || "",
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
      const reviewResult = await runReviewer(profile, candidateRoutine, onProgress, routineContext);
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
