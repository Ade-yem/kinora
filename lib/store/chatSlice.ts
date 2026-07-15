import type { StateCreator } from "zustand";
import type { AppState } from "./types";
import type { ChatMessage, PreviewState } from "@/lib/types";
import { apiGet } from "@/lib/api-client";

let messageId = 0;
function nextMessageId(): string {
  messageId += 1;
  return `msg-${messageId}`;
}

interface ChatHistoryResponse {
  chatSessionId: string;
  messages: {
    id: string;
    role: "coach" | "user";
    kind: "text" | "guardrail" | "patch";
    text: string;
    chip?: string | null;
  }[];
}

export interface ChatState {
  messages: ChatMessage[];
  chatSessionId: string | null;
  previewState: PreviewState;
  isCoachTyping: boolean;
  chatError: string | null;
}

export interface ChatSlice {
  chat: ChatState;
  initChat: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  setPreviewState: (state: PreviewState) => void;
}

function parseSseFrame(frame: string): { event: string; data: unknown } {
  const eventMatch = /^event: (.+)$/m.exec(frame);
  const dataMatch = /^data: (.+)$/m.exec(frame);
  return {
    event: eventMatch?.[1] ?? "message",
    data: dataMatch ? JSON.parse(dataMatch[1]) : null,
  };
}

export const createChatSlice: StateCreator<AppState, [], [], ChatSlice> = (set) => ({
  chat: {
    messages: [],
    chatSessionId: null,
    previewState: "chat-focus",
    isCoachTyping: false,
    chatError: null,
  },

  setPreviewState: (previewState) => set((s) => ({ chat: { ...s.chat, previewState } })),

  initChat: async () => {
    try {
      const { chatSessionId, messages } = await apiGet<ChatHistoryResponse>("/api/chat");
      set((s) => ({
        chat: {
          ...s.chat,
          chatSessionId,
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            kind: m.kind,
            text: m.text,
            chip: m.chip ?? undefined,
          })),
        },
      }));
    } catch (error) {
      set((s) => ({
        chat: { ...s.chat, chatError: error instanceof Error ? error.message : "Failed to load chat" },
      }));
    }
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: nextMessageId(), role: "user", kind: "text", text: trimmed };
    const placeholderId = nextMessageId();

    set((s) => ({
      chat: {
        ...s.chat,
        messages: [...s.chat.messages, userMessage, { id: placeholderId, role: "coach", kind: "text", text: "" }],
        isCoachTyping: true,
        chatError: null,
      },
    }));

    const appendToPlaceholder = (delta: string) => {
      set((s) => ({
        chat: {
          ...s.chat,
          messages: s.chat.messages.map((m) =>
            m.id === placeholderId ? { ...m, text: m.text + delta } : m
          ),
        },
      }));
    };

    const finalizePlaceholder = (messageId: string, kind: "text" | "guardrail") => {
      set((s) => ({
        chat: {
          ...s.chat,
          isCoachTyping: false,
          messages: s.chat.messages.map((m) => (m.id === placeholderId ? { ...m, id: messageId, kind } : m)),
        },
      }));
    };

    const markPlaceholderError = (message: string) => {
      set((s) => ({
        chat: {
          ...s.chat,
          isCoachTyping: false,
          chatError: message,
          messages: s.chat.messages.map((m) =>
            m.id === placeholderId ? { ...m, text: "Something went wrong — try again." } : m
          ),
        },
      }));
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok || !res.body) {
        markPlaceholderError("Request failed");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const { event, data } = parseSseFrame(frame);

          if (event === "delta") appendToPlaceholder((data as { text: string }).text);
          if (event === "done") {
            const d = data as { messageId: string; kind: "text" | "guardrail" };
            finalizePlaceholder(d.messageId, d.kind);
          }
          if (event === "error") markPlaceholderError((data as { message: string }).message);
        }
      }
    } catch (error) {
      markPlaceholderError(error instanceof Error ? error.message : "Request failed");
    }
  },
});
