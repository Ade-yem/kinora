import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import { RoutineActionSchema } from "@/lib/validation/routine";
import {
  mapRoutineItemToExercise,
  routineStatusToApi,
} from "@/lib/api/mappers";
import type { Routine } from "@/types";

async function getRoutine(routineId: string, userId: string) {
  const routine = await prisma.workoutRoutine.findUnique({
    where: { id: routineId },
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
      chatSession: true,
    },
  });

  if (!routine) {
    return null;
  }

  if (routine.userId !== userId) {
    return null;
  }

  const response: Routine = {
    id: routine.id,
    title: routine.title,
    subtitle: routine.subtitle || "",
    status: routineStatusToApi(routine.status, routine.finalizedAt, routine.items.length) as "empty" | "forming" | "ready" | "finalized",
    exercises: routine.items.map(mapRoutineItemToExercise),
    dayIndex: routine.dayIndex,
    totalDays: routine.totalDays,
    chatSessionId: routine.chatSessionId,
    chatSessionTitle: routine.chatSession?.title || "Workout Session",
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = RoutineActionSchema.safeParse(body);

    if (!parsed.success) {
      return respondError(parsed.error);
    }

    const { action } = parsed.data;

    const routine = await prisma.workoutRoutine.findUnique({
      where: { id },
      include: { items: { include: { exercise: true }, orderBy: { order: "asc" } } },
    });

    if (!routine) {
      return respondError(ApiError.notFound("Routine not found"));
    }

    if (routine.userId !== session.user.id) {
      return respondError(ApiError.notFound("Routine not found"));
    }

    if (action === "finalize") {
      if (routine.status !== "APPROVED" || routine.finalizedAt !== null) {
        return respondError(
          ApiError.conflict("Cannot finalize routine in current state")
        );
      }

      const updated = await prisma.workoutRoutine.update({
        where: { id },
        data: { finalizedAt: new Date() },
        include: {
          items: { include: { exercise: true }, orderBy: { order: "asc" } },
          chatSession: true,
        },
      });

      const routineResponse: Routine = {
        id: updated.id,
        title: updated.title,
        subtitle: updated.subtitle || "",
        status: routineStatusToApi(
          updated.status,
          updated.finalizedAt,
          updated.items.length
        ) as "empty" | "forming" | "ready" | "finalized",
        exercises: updated.items.map(mapRoutineItemToExercise),
        dayIndex: updated.dayIndex,
        totalDays: updated.totalDays,
        chatSessionId: updated.chatSessionId,
        chatSessionTitle: updated.chatSession?.title || "Workout Session",
      };

      return respondOk(routineResponse);
    }

    return respondError(ApiError.badRequest("Invalid action"));
  } catch (error) {
    return respondError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const { id } = await params;

    const routine = await prisma.workoutRoutine.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!routine) {
      return respondError(ApiError.notFound("Routine not found"));
    }

    await prisma.workoutRoutine.delete({
      where: { id },
    });

    return respondOk({ deleted: true });
  } catch (error) {
    return respondError(error);
  }
}
