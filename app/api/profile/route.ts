import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import { ProfileUpdateSchema } from "@/lib/validation/profile";
import { locationFromApi, locationToApi } from "@/lib/api/mappers";

async function getProfile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw ApiError.unauthorized();
  }

  let profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        userId: session.user.id,
      },
    });
  }

  return respondOk({
    id: profile.id,
    userId: profile.userId,
    goal: profile.goal,
    location: locationToApi(profile.location),
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    injuries: profile.injuries,
    injuriesNotes: profile.injuriesNotes,
    unitsPreference: profile.unitsPreference,
    logoStyle: profile.logoStyle,
    updatedAt: profile.updatedAt,
  });
}

async function updateProfile(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw ApiError.unauthorized();
  }

  const body = await request.json();
  const parsed = ProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const {
    goal,
    location,
    equipment,
    sessionDurationMinutes,
    injuriesNotes,
    unitsPreference,
    logoStyle,
    injuries,
  } = parsed.data;

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      goal,
      location: location ? locationFromApi(location) : undefined,
      equipment,
      sessionDurationMinutes,
      injuriesNotes,
      unitsPreference,
      logoStyle,
      injuries,
    },
    update: {
      goal,
      location: location ? locationFromApi(location) : undefined,
      equipment,
      sessionDurationMinutes,
      injuriesNotes,
      unitsPreference,
      logoStyle,
      injuries,
    },
  });

  return respondOk(
    {
      id: profile.id,
      userId: profile.userId,
      goal: profile.goal,
      location: locationToApi(profile.location),
      equipment: profile.equipment,
      sessionDurationMinutes: profile.sessionDurationMinutes,
      injuries: profile.injuries,
      injuriesNotes: profile.injuriesNotes,
      unitsPreference: profile.unitsPreference,
      logoStyle: profile.logoStyle,
      updatedAt: profile.updatedAt,
    },
    200
  );
}

export async function GET() {
  try {
    return await getProfile();
  } catch (error) {
    return respondError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await updateProfile(request);
  } catch (error) {
    return respondError(error);
  }
}
