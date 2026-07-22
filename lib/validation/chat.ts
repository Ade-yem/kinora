import { z } from "zod";

export const SendChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().optional().nullable(),
});
