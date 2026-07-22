import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mail";
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

    if (!user) {
      // Return a general success message to prevent user enumeration
      return respondOk({ message: "Verification link sent if account exists." });
    }

    if (user.emailVerified) {
      throw ApiError.badRequest("This email is already verified. Please log in.");
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const identifier = `email-verify:${normalizedEmail}`;

    // Clean up existing tokens and create a new one
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

    // Send verification email
    await sendVerificationEmail(normalizedEmail, token);

    return respondOk({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    return respondError(error);
  }
}
