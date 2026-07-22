import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return respondOk(sessions);
  } catch (error) {
    return respondError(error);
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const created = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        title: "New Chat",
      },
    });

    // chat opening messages are handled on client side so as to prevent
    // orphan chat sessions from being created

    return respondOk(created);
  } catch (error) {
    return respondError(error);
  }
}
