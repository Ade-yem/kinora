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
import { RoutineListQuerySchema } from "@/lib/validation/routine";
import { routineStatusToApi } from "@/lib/api/mappers";

const PROGRAM_SUMMARY_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  status: true,
  finalizedAt: true,
  totalDays: true,
  updatedAt: true,
  chatSessionId: true,
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

type DbProgramSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  finalizedAt: Date | null;
  totalDays: number;
  updatedAt: Date;
  chatSessionId: string | null;
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

function toProgramSummary(p: DbProgramSummary) {
  let exerciseCount = 0;
  const logsMap = new Map<string, typeof p.routines[0]["logs"][0]>();

  p.routines.forEach((r) => {
    exerciseCount += r.items.length;
    r.logs.forEach((log) => {
      logsMap.set(log.id, log);
    });
  });

  const sortedRoutines = [...p.routines].sort((a, b) => a.dayIndex - b.dayIndex);
  const firstRoutineId = sortedRoutines[0]?.id || "";

  const apiStatus = routineStatusToApi(p.status, p.finalizedAt, exerciseCount);

  return {
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    status: apiStatus,
    totalDays: p.totalDays,
    updatedAt: p.updatedAt.toISOString(),
    chatSessionId: p.chatSessionId,
    exerciseCount,
    estimatedDurationMinutes: exerciseCount * 6,
    firstRoutineId,
    logs: Array.from(logsMap.values()).map(log => ({
      ...log,
      performedAt: log.performedAt.toISOString()
    })),
  };
}

function toProgramDetail(p: DbProgramSummary) {
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = RoutineListQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return respondError(parsed.error);
    }

    const { page, pageSize, status, chatSessionId } = parsed.data;
    const { skip, take } = parsePagination({ page: String(page), pageSize: String(pageSize) });

    const where: Record<string, any> = {
      userId: session.user.id,
    };
    if (chatSessionId) {
      where.chatSessionId = chatSessionId;
    }

    // Because status is derived, filter in JS when status is requested
    if (status) {
      const programs = await prisma.workoutProgram.findMany({
        where,
        select: PROGRAM_SUMMARY_SELECT,
        orderBy: { updatedAt: "desc" },
      });

      const mapped = programs.map(toProgramSummary);
      const filtered = mapped.filter((p) => p.status === status);
      const pagination = buildPaginationMeta(page, pageSize, filtered.length);

      // If we are looking for a session program specifically, we return the detailed structure
      // that includes routines so the frontend has them instantly.
      if (chatSessionId) {
        const detailedFiltered = programs
          .map(toProgramDetail)
          .filter((p) => p.status === status);

        return respondOk<PaginatedResponse<any>>({
          data: detailedFiltered.slice(skip, skip + take),
          pagination,
        });
      }

      return respondOk<PaginatedResponse<any>>({
        data: filtered.slice(skip, skip + take),
        pagination,
      });
    }

    const totalItems = await prisma.workoutProgram.count({ where });
    const programs = await prisma.workoutProgram.findMany({
      where,
      select: PROGRAM_SUMMARY_SELECT,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
    });

    if (chatSessionId) {
      return respondOk<PaginatedResponse<any>>({
        data: programs.map(toProgramDetail),
        pagination: buildPaginationMeta(page, pageSize, totalItems),
      });
    }

    return respondOk<PaginatedResponse<any>>({
      data: programs.map(toProgramSummary),
      pagination: buildPaginationMeta(page, pageSize, totalItems),
    });
  } catch (error) {
    return respondError(error);
  }
}
