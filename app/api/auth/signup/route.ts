import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import bcrypt from "bcryptjs";
import { z } from "zod";

import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user, profile, and verification token in a transaction
    const { user, token } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
        },
      });

      const verificationToken = crypto.randomUUID();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await tx.verificationToken.create({
        data: {
          identifier: `email-verify:${normalizedEmail}`,
          token: verificationToken,
          expires,
        },
      });

      return { user: newUser, token: verificationToken };
    });

    // Send verification email
    sendVerificationEmail(user.email!, token).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return respondOk(
      {
        message: "Verification email sent. Please check your inbox.",
        email: user.email,
      },
      201
    );
  } catch (error) {
    return respondError(error);
  }
}
