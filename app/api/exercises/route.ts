import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import {
  parsePagination,
  buildPaginationMeta,
  PaginatedResponse,
} from "@/lib/api/pagination";
import { ExerciseListQuerySchema } from "@/lib/validation/exercise";

interface ExerciseSummary {
  id: string;
  name: string;
  primeMoverMuscle: string | null;
  targetMuscleGroup: string | null;
  bodyRegion: string | null;
  difficultyLevel: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = ExerciseListQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return respondError(parsed.error);
    }

    const { page, pageSize, search, targetMuscleGroup, bodyRegion, classification, sortBy, sortOrder } = parsed.data;
    const { skip, take } = parsePagination({ page: String(page), pageSize: String(pageSize) });

    const where: Record<string, unknown> = {};

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (targetMuscleGroup) {
      where.targetMuscleGroup = targetMuscleGroup;
    }

    if (bodyRegion) {
      where.bodyRegion = bodyRegion;
    }

    if (classification) {
      where.primaryClassification = classification;
    }

    const totalItems = await prisma.exercise.count({ where });
    const exercises = await prisma.exercise.findMany({
      where,
      select: {
        id: true,
        name: true,
        primeMoverMuscle: true,
        targetMuscleGroup: true,
        bodyRegion: true,
        difficultyLevel: true,
      },
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const pagination = buildPaginationMeta(page, pageSize, totalItems);

    return respondOk<PaginatedResponse<ExerciseSummary>>({
      data: exercises as ExerciseSummary[],
      pagination,
    });
  } catch (error) {
    return respondError(error);
  }
}
