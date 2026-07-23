import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import { RoutineActionSchema } from "@/lib/validation/routine";
import { routineStatusToApi } from "@/lib/api/mappers";

const PROGRAM_DETAIL_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  status: true,
  finalizedAt: true,
  totalDays: true,
  updatedAt: true,
  chatSessionId: true,
  userId: true,
  routines: {
    select: {
      id: true,
      dayIndex: true,
      title: true,
      subtitle: true,
      updatedAt: true,
      programId: true,
      items: { select: { id: true } },
      logs: {
        select: {
          id: true,
          performedAt: true,
          durationSeconds: true,
          totalVolumeKg: true,
        },
      },
    },
    orderBy: { dayIndex: "asc" },
  },
} as const;

type DbProgramDetail = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  finalizedAt: Date | null;
  totalDays: number;
  updatedAt: Date;
  chatSessionId: string | null;
  userId: string;
  routines: {
    id: string;
    dayIndex: number;
    title: string;
    subtitle: string | null;
    updatedAt: Date;
    programId: string;
    items: { id: string }[];
    logs: {
      id: string;
      performedAt: Date;
      durationSeconds: number | null;
      totalVolumeKg: number | null;
    }[];
  }[];
};

function toProgramDetail(p: DbProgramDetail) {
  let exerciseCount = 0;
  p.routines.forEach((r) => {
    exerciseCount += r.items.length;
  });

  const apiStatus = routineStatusToApi(p.status, p.finalizedAt, exerciseCount);

  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    status: apiStatus,
    totalDays: p.totalDays,
    chatSessionId: p.chatSessionId,
    updatedAt: p.updatedAt.toISOString(),
    routines: p.routines.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      status: apiStatus,
      dayIndex: r.dayIndex,
      totalDays: p.totalDays,
      updatedAt: r.updatedAt.toISOString(),
      programId: r.programId,
      chatSessionId: p.chatSessionId,
      exerciseCount: r.items.length,
      estimatedDurationMinutes: r.items.length * 6,
      logs: r.logs.map(log => ({
        ...log,
        performedAt: log.performedAt.toISOString()
      })),
    })),
  };
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

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
      select: PROGRAM_DETAIL_SELECT,
    });

    if (!program) {
      return respondError(ApiError.notFound("Program not found"));
    }

    if (program.userId !== session.user.id) {
      return respondError(ApiError.notFound("Program not found"));
    }

    return respondOk(toProgramDetail(program));
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

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
      select: PROGRAM_DETAIL_SELECT,
    });

    if (!program) {
      return respondError(ApiError.notFound("Program not found"));
    }

    if (program.userId !== session.user.id) {
      return respondError(ApiError.notFound("Program not found"));
    }

    if (action === "finalize") {
      let exerciseCount = 0;
      program.routines.forEach((r) => {
        exerciseCount += r.items.length;
      });

      const currentStatus = routineStatusToApi(program.status, program.finalizedAt, exerciseCount);
      if (currentStatus !== "ready" || program.finalizedAt !== null) {
        return respondError(
          ApiError.conflict("Cannot finalize program in current state")
        );
      }

      const updated = await prisma.workoutProgram.update({
        where: { id },
        data: { finalizedAt: new Date() },
        select: PROGRAM_DETAIL_SELECT,
      });

      return respondOk(toProgramDetail(updated));
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

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!program) {
      return respondError(ApiError.notFound("Program not found"));
    }

    if (program.userId !== session.user.id) {
      return respondError(ApiError.notFound("Program not found"));
    }

    await prisma.workoutProgram.delete({
      where: { id },
    });

    return respondOk({ deleted: true });
  } catch (error) {
    return respondError(error);
  }
}
