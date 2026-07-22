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
    ...profile,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
    preferredLocation: profile.preferredLocation ? locationToApi(profile.preferredLocation) : null,
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
    weight,
    height,
    dateOfBirth,
    biologicalSex,
    experienceLevel,
    preferredLocation,
    unitsPreference,
    logoStyle,
  } = parsed.data;

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      weight,
      height,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      biologicalSex,
      experienceLevel,
      preferredLocation: preferredLocation ? locationFromApi(preferredLocation) as any : null,
      unitsPreference,
      logoStyle,
    },
    update: {
      weight: weight !== undefined ? weight : undefined,
      height: height !== undefined ? height : undefined,
      dateOfBirth: dateOfBirth !== undefined ? (dateOfBirth ? new Date(dateOfBirth) : null) : undefined,
      biologicalSex: biologicalSex !== undefined ? biologicalSex : undefined,
      experienceLevel: experienceLevel !== undefined ? experienceLevel : undefined,
      preferredLocation: preferredLocation !== undefined ? (preferredLocation ? locationFromApi(preferredLocation) as any : null) : undefined,
      unitsPreference: unitsPreference !== undefined ? unitsPreference : undefined,
      logoStyle: logoStyle !== undefined ? logoStyle : undefined,
    },
  });

  return respondOk(
    {
      id: profile.id,
      userId: profile.userId,
      weight: profile.weight,
      height: profile.height,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : null,
      biologicalSex: profile.biologicalSex,
      experienceLevel: profile.experienceLevel,
      preferredLocation: profile.preferredLocation ? locationToApi(profile.preferredLocation) : null,
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
