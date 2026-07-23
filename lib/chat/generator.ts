import { llmClient, DEEPSEEK_MODEL } from "@/lib/llm";
import { prisma } from "@/lib/db";
import {
  BodyRegion,
  TargetMuscleGroup,
  PrimaryExerciseClassification,
  Prisma,
  UserProfile,
} from "@/app/generated/prisma/client";
import { REVIEWER_SYSTEM_PROMPT } from "./prompt";

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
  exercises: ExerciseCandidate[];
}

export interface ProgramCandidate {
  programTitle: string;
  totalDays: number;
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


export async function runReviewer(
  biodataText: string,
  locationText: string,
  equipmentText: string,
  durationText: string,
  injuriesText: string,
  candidateRoutine: ProgramCandidate,
  onProgress: (text: string) => void,
  currentRoutineContext?: string,
  userRequestSummary?: string
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
${userRequestSummary ? `- User's Specific Request & Goals: ${userRequestSummary}\n` : ""}

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
export async function saveRoutineToDb({
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
    // 1. Find or create the WorkoutProgram for this chatSessionId
    let program = await tx.workoutProgram.findFirst({
      where: { chatSessionId },
    });

    const dbReviewNotes = (reviewNotes !== undefined && reviewNotes !== null)
      ? (reviewNotes as Prisma.InputJsonValue)
      : (status === "REJECTED"
        ? ({ error: "Rejected by reviewer" } as Prisma.InputJsonValue)
        : Prisma.DbNull);

    const totalDays = Number(routineData.totalDays) || routinesList.length;

    if (program) {
      program = await tx.workoutProgram.update({
        where: { id: program.id },
        data: {
          title: programTitle,
          subtitle: routinesList[0]?.subtitle || null,
          status,
          reviewNotes: dbReviewNotes,
          totalDays,
        },
      });
    } else {
      program = await tx.workoutProgram.create({
        data: {
          userId,
          chatSessionId,
          title: programTitle,
          subtitle: routinesList[0]?.subtitle || null,
          status,
          reviewNotes: dbReviewNotes,
          totalDays,
        },
      });
    }

    const savedRoutines = [];

    // 2. Upsert routines linked to this program
    for (const rData of routinesList) {
      const title = rData.title || programTitle;
      const subtitle = rData.subtitle || "";
      const exercises = rData.exercises || [];
      const dayIndex = rData.dayIndex ? Number(rData.dayIndex) : 1;

      const existingRoutine = await tx.workoutRoutine.findFirst({
        where: { programId: program.id, dayIndex },
      });

      let routine;
      if (existingRoutine) {
        routine = await tx.workoutRoutine.update({
          where: { id: existingRoutine.id },
          data: {
            title,
            subtitle,
          },
        });

        await tx.routineItem.deleteMany({
          where: { routineId: existingRoutine.id },
        });
      } else {
        routine = await tx.workoutRoutine.create({
          data: {
            programId: program.id,
            dayIndex,
            title,
            subtitle,
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

    // 3. Delete any routines from this program that exceed the new totalDays
    await tx.workoutRoutine.deleteMany({
      where: {
        programId: program.id,
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
