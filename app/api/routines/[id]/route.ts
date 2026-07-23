import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import type { Routine } from "@/types";
import { routineStatusToApi, mapRoutineItemToExercise } from "@/lib/api/mappers";

async function getRoutine(routineId: string, userId: string) {
  const routine = await prisma.workoutRoutine.findUnique({
    where: { id: routineId },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
      program: {
        include: {
          chatSession: true,
        },
      },
    },
  });

  if (!routine) {
    return null;
  }

  if (routine.program.userId !== userId) {
    return null;
  }

  const response: Routine = {
    id: routine.id,
    title: routine.title,
    subtitle: routine.subtitle || "",
    status: routineStatusToApi(routine.program.status, routine.program.finalizedAt, routine.items.length) as "empty" | "forming" | "ready" | "finalized",
    exercises: routine.items.map(mapRoutineItemToExercise),
    dayIndex: routine.dayIndex,
    totalDays: routine.program.totalDays,
    chatSessionId: routine.program.chatSessionId,
    chatSessionTitle: routine.program.chatSession?.title || "Workout Session",
    programId: routine.programId,
  };

  return response;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const { id } = await params;
    const routine = await getRoutine(id, session.user.id);

    if (!routine) {
      return respondError(ApiError.notFound("Routine not found"));
    }

    return respondOk(routine);
  } catch (error) {
    return respondError(error);
  }
}
