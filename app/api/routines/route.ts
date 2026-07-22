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
import {
  routineStatusToApi,
} from "@/lib/api/mappers";

interface RoutineSummary {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  dayIndex: number | null;
  totalDays: number | null;
  updatedAt: Date;
  programId: string | null;
  chatSessionId: string | null;
  exerciseCount: number;
  estimatedDurationMinutes: number;
  logs: {
    id: string;
    performedAt: Date;
    durationSeconds: number | null;
    totalVolumeKg: number | null;
  }[];
}

const ROUTINE_SUMMARY_SELECT = {
  id: true,
  title: true,
  subtitle: true,
  status: true,
  finalizedAt: true,
  dayIndex: true,
  totalDays: true,
  updatedAt: true,
  programId: true,
  chatSessionId: true,
  items: { select: { id: true } },
  logs: {
    select: {
      id: true,
      performedAt: true,
      durationSeconds: true,
      totalVolumeKg: true,
    },
  },
} as const;

function toRoutineSummary(r: {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  finalizedAt: Date | null;
  dayIndex: number | null;
  totalDays: number | null;
  updatedAt: Date;
  programId: string | null;
  chatSessionId: string | null;
  items: { id: string }[];
  logs: {
    id: string;
    performedAt: Date;
    durationSeconds: number | null;
    totalVolumeKg: number | null;
  }[];
}): RoutineSummary {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    status: routineStatusToApi(r.status, r.finalizedAt, r.items.length),
    dayIndex: r.dayIndex,
    totalDays: r.totalDays,
    updatedAt: r.updatedAt,
    programId: r.programId,
    chatSessionId: r.chatSessionId,
    exerciseCount: r.items.length,
    estimatedDurationMinutes: r.items.length * 6,
    logs: r.logs,
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

    const where: Record<string, any> = { userId: session.user.id };
    if (chatSessionId) {
      where.chatSessionId = chatSessionId;
    }

    // `status` is a derived value (from `status`/`finalizedAt`/`items.length`, not a raw
    // column), so it can't be pushed into the Prisma `where` clause. When it's requested,
    // we have to fetch every matching row, filter in JS, and paginate the filtered result —
    // otherwise `skip`/`take` slices the wrong rows and the totals come out wrong.
    if (status) {
      const routines = await prisma.workoutRoutine.findMany({
        where,
        select: ROUTINE_SUMMARY_SELECT,
        orderBy: { updatedAt: "desc" },
      });

      const filtered = routines
        .map(toRoutineSummary)
        .filter((r: RoutineSummary) => r.status === status);
      const pagination = buildPaginationMeta(page, pageSize, filtered.length);

      return respondOk<PaginatedResponse<RoutineSummary>>({
        data: filtered.slice(skip, skip + take),
        pagination,
      });
    }

    const totalItems = await prisma.workoutRoutine.count({ where });
    const routines = await prisma.workoutRoutine.findMany({
      where,
      select: ROUTINE_SUMMARY_SELECT,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
    });

    return respondOk<PaginatedResponse<RoutineSummary>>({
      data: routines.map(toRoutineSummary),
      pagination: buildPaginationMeta(page, pageSize, totalItems),
    });
  } catch (error) {
    return respondError(error);
  }
}
