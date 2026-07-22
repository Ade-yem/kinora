import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent email enumeration, always return ok even if user doesn't exist
    if (!user || !user.passwordHash) {
      return respondOk({
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const identifier = `password-reset:${normalizedEmail}`;

    // Clean up existing password reset tokens for this user, then create a new one
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier },
      }),
      prisma.verificationToken.create({
        data: {
          identifier,
          token,
          expires,
        },
      }),
    ]);

    // Send reset password email
    const res = await sendPasswordResetEmail(normalizedEmail, token);
    console.log(res)

    return respondOk({
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    return respondError(error);
  }
}
