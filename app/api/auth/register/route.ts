import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { RegisterSchema } from "@/lib/validation/auth";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return respondError(parsed.error);
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return respondError(ApiError.conflict("Email already taken"));
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    return respondOk(
      {
        id: user.id,
        email: user.email,
      },
      201
    );
  } catch (error) {
    return respondError(error);
  }
}
