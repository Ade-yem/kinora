import { prisma } from "@/lib/db";

const OPENING_GREETING =
  "Yo! How are you doing today?";

  /**
   * Resolves a chat session based on the user's ID.
   * Normally, a new session is only created after the user sends the first message so as to prevent orphan chat sessions
   * If the request explicitly wants a new session (e.g. they sent a message from the blank template), bypass the existing check and create a new session directly.
   * @param userId user's id
   * @param isNew checks if we want to resolve a new chat
   * @returns resolved chat session
   */
export async function resolveChatSession(userId: string, isNew: boolean) {
  if (isNew) {
    const created = await prisma.chatSession.create({
      data: { userId },
    });
    return { session: created, isNew: true };
  }

  const existing = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { session: existing, isNew: false };
  }


  return { session: null, isNew: true };
}

export async function ensureOpeningMessage(chatSessionId: string) {
  return prisma.chatMessage.create({
    data: {
      chatSessionId,
      role: "COACH",
      kind: "TEXT",
      text: OPENING_GREETING,
    },
  });
}
