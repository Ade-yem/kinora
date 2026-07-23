import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const { id } = await params;

    // Check if the chat session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!chatSession) {
      return respondError(ApiError.notFound("Chat session not found"));
    }

    // 1. Explicitly delete any unfinalized programs (where finalizedAt is null) associated with this chat session
    await prisma.workoutProgram.deleteMany({
      where: {
        chatSessionId: id,
        finalizedAt: null,
      },
    });

    // 2. Delete the chat session. This will:
    //    - Cascade-delete messages.
    //    - Set chatSessionId to null for any remaining finalized workout routines (via onDelete: SetNull).
    await prisma.chatSession.delete({
      where: { id },
    });

    return respondOk({ deleted: true });
  } catch (error) {
    return respondError(error);
  }
}
