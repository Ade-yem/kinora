import { prisma } from "@/lib/db";

const OPENING_GREETING =
  "Yo! Let's build today's session ⚡ What are we training, and where are you working out — home or gym?";

export async function resolveChatSession(userId: string) {
  const existing = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { session: existing, isNew: false };
  }

  const created = await prisma.chatSession.create({
    data: { userId },
  });

  return { session: created, isNew: true };
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
