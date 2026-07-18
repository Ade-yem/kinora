import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { llmClient, DEEPSEEK_MODEL } from "@/lib/llm";
import { prisma } from "@/lib/db";
import { CHAT_SYSTEM_PROMPT } from "./prompt";
import { CHAT_TOOLS, executeToolCall } from "./tools";

const MAX_TOOL_TURNS = 4;
const GUARDRAIL_MARKER = "<<GUARDRAIL>>";
const FALLBACK_TEXT = "I wasn't able to build a routine that met my own safety/quality bar after a few tries — let's simplify: tell me one thing to relax (shorter session, fewer exercises, different equipment) and I'll try again.";

interface HistoryMessage {
  role: "COACH" | "USER";
  text: string;
}

function toOpenAiMessage(m: HistoryMessage): ChatCompletionMessageParam {
  return { role: m.role === "COACH" ? "assistant" : "user", content: m.text };
}

function sseFrame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function createChatStream({
  userId,
  chatSessionId,
  history,
  userText,
}: {
  userId: string;
  chatSessionId: string;
  history: HistoryMessage[];
  userText: string;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueueSseDelta = (text: string) => {
        controller.enqueue(encoder.encode(sseFrame("delta", { text })));
      };

      const enqueueSseThought = (text: string) => {
        controller.enqueue(encoder.encode(sseFrame("thought", { text })));
      };

      try {
        if (!DEEPSEEK_MODEL) {
          throw new Error("DEEPSEEK_MODEL is not configured");
        }

        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          ...history.map(toOpenAiMessage),
          { role: "user", content: userText },
        ];

        let finalText = "";
        let hasExecutedPatch = false;

        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const completion = await llmClient.chat.completions.create({
            model: DEEPSEEK_MODEL,
            messages,
            tools: CHAT_TOOLS,
            stream: true,
          });

          const toolCalls: Record<number, { id: string; name: string; args: string }> = {};
          let assistantText = "";
          let finishReason: string | null = null;

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

            if (delta?.content) {
              assistantText += delta.content;
              enqueueSseDelta(delta.content);
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const slot = (toolCalls[tc.index] ??= { id: "", name: "", args: "" });
                if (tc.id) slot.id = tc.id;
                if (tc.function?.name) slot.name += tc.function.name;
                if (tc.function?.arguments) slot.args += tc.function.arguments;
              }
            }
          }

          const callList = Object.values(toolCalls);

          if (finishReason !== "tool_calls" || callList.length === 0) {
            finalText = assistantText;
            break;
          }

          messages.push({
            role: "assistant",
            content: assistantText || null,
            tool_calls: callList.map((c) => ({
              id: c.id,
              type: "function" as const,
              function: { name: c.name, arguments: c.args },
            })),
          });

          for (const call of callList) {
            if (call.name === "modify_workout_routine") {
              hasExecutedPatch = true;
            }
            const result = await executeToolCall(
              call.name,
              call.args,
              userId,
              chatSessionId,
              enqueueSseThought
            );
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });

            if ((call.name === "generate_workout_routine" || call.name === "modify_workout_routine") && (result as {
              success: boolean;
              routineId: string;
              title: string;
              subtitle: string;
              status: string;
            }).status === "REJECTED") {
              enqueueSseThought(FALLBACK_TEXT);
              finalText = FALLBACK_TEXT;
              break;
            }
          }
        }

        const isGuardrail = finalText.trim().toUpperCase().startsWith(GUARDRAIL_MARKER);
        const cleanedText = isGuardrail
          ? finalText.replace(new RegExp(`^\\s*${GUARDRAIL_MARKER}\\s*`, "i"), "")
          : finalText;

        let kind: "TEXT" | "GUARDRAIL" | "PATCH" = "TEXT";
        if (isGuardrail) {
          kind = "GUARDRAIL";
        } else if (hasExecutedPatch) {
          kind = "PATCH";
        }

        const saved = await prisma.chatMessage.create({
          data: {
            chatSessionId,
            role: "COACH",
            kind,
            text: cleanedText,
          },
        });

        controller.enqueue(
          encoder.encode(
            sseFrame("done", {
              messageId: saved.id,
              kind: kind.toLowerCase(),
              createdAt: saved.createdAt,
            })
          )
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseFrame("error", {
              message: error instanceof Error ? error.message : "Chat failed",
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });
}
