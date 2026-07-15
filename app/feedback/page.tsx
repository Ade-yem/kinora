"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

const QUICK_REPLIES = ["Too easy", "Just right", "Too hard"];

export default function FeedbackPage() {
  useRequireAuth();
  const routineTitle = useAppStore((s) => s.routine.title) || "today's session";
  const initChat = useAppStore((s) => s.initChat);
  const messages = useAppStore((s) => s.chat.messages);
  const isCoachTyping = useAppStore((s) => s.chat.isCoachTyping);
  const sendMessage = useAppStore((s) => s.sendMessage);

  useEffect(() => {
    initChat();
  }, [initChat]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5 py-6">
      <div className="mb-3.5 rounded-2xl border border-volt/40 bg-volt/18 px-3.5 py-3 text-center text-[13px] font-bold">
        🎉 Nice work finishing {routineTitle}!
      </div>

      <ChatThread messages={messages} isCoachTyping={isCoachTyping} />

      <div className="mb-2 flex flex-wrap gap-1.5">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => sendMessage(reply)}
            className="rounded-2xl border-[1.5px] border-ink/15 px-3 py-1.5 text-xs font-semibold"
          >
            {reply}
          </button>
        ))}
      </div>

      <ChatInput onSend={sendMessage} />

      <Button variant="dark" href="/home" className="mt-2">
        Back to Home
      </Button>
    </main>
  );
}
