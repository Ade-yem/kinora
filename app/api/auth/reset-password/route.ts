import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { email, token, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const identifier = `password-reset:${normalizedEmail}`;

    // Find the token
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token,
      },
    });

    if (!resetToken) {
      throw ApiError.badRequest("Invalid or expired password reset token.");
    }

    // Check expiration
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      }).catch(() => {});
      throw ApiError.badRequest("Password reset link has expired. Please request a new one.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return respondOk({ message: "Password has been reset successfully. You can now log in." });
  } catch (error) {
    return respondError(error);
  }
}
