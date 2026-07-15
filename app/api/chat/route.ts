import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondError, respondOk } from "@/lib/http/response";
import { ApiError } from "@/lib/http/errors";
import { SendChatMessageSchema } from "@/lib/validation/chat";
import { chatRoleToApi, chatMessageKindToApi } from "@/lib/api/mappers";
import { resolveChatSession, ensureOpeningMessage } from "@/lib/chat/session";
import { createChatStream } from "@/lib/chat/stream";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const { session: chatSession, isNew } = await resolveChatSession(session.user.id);

    if (isNew) {
      await ensureOpeningMessage(chatSession.id);
    }

    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
    });

    return respondOk({
      chatSessionId: chatSession.id,
      messages: messages.map((m: (typeof messages)[number]) => ({
        id: m.id,
        role: chatRoleToApi(m.role),
        kind: chatMessageKindToApi(m.kind),
        text: m.text,
        chip: m.chip,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return respondError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return respondError(ApiError.unauthorized());
    }

    const body = await request.json();
    const parsed = SendChatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return respondError(parsed.error);
    }

    const { message } = parsed.data;
    const { session: chatSession } = await resolveChatSession(session.user.id);

    // Fetch history before persisting the new user message — it's appended
    // separately when building the LLM's message list (see lib/chat/stream.ts).
    const priorMessages = await prisma.chatMessage.findMany({
      where: { chatSessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      select: { role: true, text: true },
    });

    // Persisted before the LLM call so it's on record even if that call fails.
    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role: "USER",
        kind: "TEXT",
        text: message,
      },
    });

    const stream = createChatStream({
      userId: session.user.id,
      chatSessionId: chatSession.id,
      history: priorMessages,
      userText: message,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return respondError(error);
  }
}
