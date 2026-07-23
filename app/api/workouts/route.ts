import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import {
  parsePagination,
  buildPaginationMeta,
  PaginatedResponse,
} from "@/lib/api/pagination";
import { WorkoutListQuerySchema, CreateWorkoutLogSchema } from "@/lib/validation/workout";

interface WorkoutLogSummary {
  id: string;
  routineId: string;
  performedAt: Date;
  durationSeconds: number | null;
}

async function listWorkouts(request: NextRequest, userId: string) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = WorkoutListQuerySchema.safeParse(searchParams);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { page, pageSize, routineId } = parsed.data;
  const { skip, take } = parsePagination({ page: String(page), pageSize: String(pageSize) });

  const where: Record<string, unknown> = { userId };
  if (routineId) {
    where.routineId = routineId;
  }

  const totalItems = await prisma.workoutLog.count({ where });
  const logs = await prisma.workoutLog.findMany({
    where,
    select: {
      id: true,
      routineId: true,
      performedAt: true,
      durationSeconds: true,
    },
    skip,
    take,
    orderBy: { performedAt: "desc" },
  });

  const pagination = buildPaginationMeta(page, pageSize, totalItems);

  return respondOk<PaginatedResponse<WorkoutLogSummary>>({
    data: logs as WorkoutLogSummary[],
    pagination,
  });
}

async function createWorkout(request: NextRequest, userId: string) {
  const body = await request.json();
  const parsed = CreateWorkoutLogSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { routineId, durationSeconds, entries, totalVolumeKg } = parsed.data;

  const routine = await prisma.workoutRoutine.findUnique({
    where: { id: routineId },
    select: {
      program: {
        select: { userId: true },
      },
    },
  });

  if (!routine) {
    throw ApiError.notFound("Routine not found");
  }

  if (routine.program.userId !== userId) {
    throw ApiError.notFound("Routine not found");
  }

  const log = await prisma.workoutLog.create({
    data: {
      routineId,
      userId,
      durationSeconds,
      entries,
      totalVolumeKg,
    },
  });

  return respondOk(
    {
      id: log.id,
      routineId: log.routineId,
      userId: log.userId,
      performedAt: log.performedAt,
      durationSeconds: log.durationSeconds,
      entries: log.entries,
      totalVolumeKg: log.totalVolumeKg,
      createdAt: log.createdAt,
    },
    201
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    return await listWorkouts(request, session.user.id);
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    return await createWorkout(request, session.user.id);
  } catch (error) {
    return respondError(error);
  }
}
