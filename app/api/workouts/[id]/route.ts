import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

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

    const log = await prisma.workoutLog.findUnique({
      where: { id },
      select: {
        id: true,
        routineId: true,
        userId: true,
        performedAt: true,
        durationSeconds: true,
        entries: true,
        totalVolumeKg: true,
        createdAt: true,
      },
    });

    if (!log) {
      return respondError(ApiError.notFound("Workout not found"));
    }

    if (log.userId !== session.user.id) {
      return respondError(ApiError.notFound("Workout not found"));
    }

    return respondOk(log);
  } catch (error) {
    return respondError(error);
  }
}
