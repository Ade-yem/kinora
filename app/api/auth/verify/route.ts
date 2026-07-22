import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      throw ApiError.badRequest("Missing token or email parameter.");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const identifier = `email-verify:${normalizedEmail}`;

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token,
      },
    });

    if (!verificationToken) {
      throw ApiError.badRequest("Invalid or expired verification link.");
    }

    // Check expiration
    if (verificationToken.expires < new Date()) {
      // Delete the expired token
      await prisma.verificationToken.delete({
        where: { token },
      }).catch(() => {});
      throw ApiError.badRequest("Verification link has expired. Please sign up again or request a new link.");
    }

    // Perform verification in a transaction: set verified and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return respondOk({ message: "Email verified successfully." });
  } catch (error) {
    return respondError(error);
  }
}
