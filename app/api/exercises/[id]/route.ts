import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

interface ExerciseDetail {
  id: string;
  name: string;
  shortDemoVideoUrl: string | null;
  inDepthExplanationVideoUrl: string | null;
  difficultyLevel: string | null;
  targetMuscleGroup: string | null;
  primeMoverMuscle: string | null;
  secondaryMuscle: string | null;
  tertiaryMuscle: string | null;
  primaryEquipment: string | null;
  secondaryEquipment: string | null;
  posture: string | null;
  grip: string | null;
  bodyRegion: string | null;
  instructions: Record<string, unknown> | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return respondError(ApiError.notFound("Exercise not found"));
    }

    const response: ExerciseDetail = {
      id: exercise.id,
      name: exercise.name,
      shortDemoVideoUrl: exercise.shortDemoVideoUrl,
      inDepthExplanationVideoUrl: exercise.inDepthExplanationVideoUrl,
      difficultyLevel: exercise.difficultyLevel,
      targetMuscleGroup: exercise.targetMuscleGroup,
      primeMoverMuscle: exercise.primeMoverMuscle,
      secondaryMuscle: exercise.secondaryMuscle,
      tertiaryMuscle: exercise.tertiaryMuscle,
      primaryEquipment: exercise.primaryEquipment,
      secondaryEquipment: exercise.secondaryEquipment,
      posture: exercise.posture,
      grip: exercise.grip,
      bodyRegion: exercise.bodyRegion,
      instructions: exercise.instructions as Record<string, unknown> | null,
    };

    return respondOk(response);
  } catch (error) {
    return respondError(error);
  }
}
