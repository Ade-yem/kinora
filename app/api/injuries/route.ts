import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import { z } from "zod";

const InjuryCreateSchema = z.object({
  bodyPart: z.string().trim().min(1).max(100),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
  note: z.string().trim().optional(),
  onsetDate: z.string().refine((val) => !val || !isNaN(Date.parse(val))).optional(),
});

const InjuryUpdateSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "RECOVERING", "RESOLVED"]).optional(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]).optional(),
  note: z.string().trim().optional(),
  onsetDate: z.string().refine((val) => !val || !isNaN(Date.parse(val))).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const injuries = await prisma.injury.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return respondOk({ injuries });
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const parsed = InjuryCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { bodyPart, severity, note, onsetDate } = parsed.data;

    const injury = await prisma.injury.create({
      data: {
        userId: session.user.id,
        bodyPart,
        severity,
        note: note || null,
        onsetDate: onsetDate ? new Date(onsetDate) : null,
        status: "ACTIVE",
      },
    });

    return respondOk({ injury }, 201);
  } catch (error) {
    return respondError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const parsed = InjuryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw parsed.error;
    }

    const { id, status, severity, note, onsetDate } = parsed.data;

    // Verify ownership
    const existing = await prisma.injury.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      throw ApiError.notFound("Injury not found or unauthorized");
    }

    const injury = await prisma.injury.update({
      where: { id },
      data: {
        status,
        severity,
        note: note !== undefined ? note : undefined,
        onsetDate: onsetDate !== undefined ? (onsetDate ? new Date(onsetDate) : null) : undefined,
      },
    });

    return respondOk({ injury });
  } catch (error) {
    return respondError(error);
  }
}
