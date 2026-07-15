import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { prisma } from "@/lib/db";
import { locationFromApi, locationToApi } from "@/lib/api/mappers";
import { ProfileUpdateSchema } from "@/lib/validation/profile";

export const CHAT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Read back the user's previously confirmed training profile (goal, location, equipment, session duration, injuries). Call this silently at the start of your reasoning so you don't re-ask for fields already known.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "update_user_profile",
      description:
        "Persist training profile fields the user has just explicitly confirmed. Only pass fields that were actually stated this conversation — never invent values.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The user's fitness goal, in their own words." },
          location: { type: "string", enum: ["home", "gym"], description: "Where the user trains." },
          equipment: {
            type: "array",
            items: { type: "string" },
            description: "Equipment the user has available, in their own words.",
          },
          sessionDurationMinutes: {
            type: "number",
            description: "How many minutes the user wants a session to last.",
          },
          injuriesNotes: {
            type: "string",
            description: "Free-text notes on any injuries, pain, or physical limitations the user mentioned.",
          },
        },
        additionalProperties: false,
      },
    },
  },
];

async function getUserProfile(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    return { found: false };
  }

  return {
    found: true,
    goal: profile.goal,
    location: locationToApi(profile.location),
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    injuriesNotes: profile.injuriesNotes,
    injuries: profile.injuries,
  };
}

async function updateUserProfile(userId: string, argsJson: string) {
  let args: unknown;
  try {
    args = JSON.parse(argsJson);
  } catch {
    return { error: "invalid arguments: not valid JSON" };
  }

  const parsed = ProfileUpdateSchema.safeParse(args);
  if (!parsed.success) {
    return { error: "invalid arguments", details: parsed.error.flatten() };
  }

  const { goal, location, equipment, sessionDurationMinutes, injuriesNotes } = parsed.data;

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: {
      goal,
      location: location ? locationFromApi(location) : undefined,
      equipment,
      sessionDurationMinutes,
      injuriesNotes,
    },
  });

  return {
    saved: true,
    goal: profile.goal,
    location: locationToApi(profile.location),
    equipment: profile.equipment,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    injuriesNotes: profile.injuriesNotes,
  };
}

export async function executeToolCall(
  name: string,
  argsJson: string,
  userId: string
): Promise<unknown> {
  if (name === "get_user_profile") {
    return getUserProfile(userId);
  }
  if (name === "update_user_profile") {
    return updateUserProfile(userId, argsJson);
  }
  return { error: `unknown tool: ${name}` };
}
