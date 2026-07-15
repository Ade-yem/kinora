"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble, TypingBubble } from "./MessageBubble";

export function ChatThread({
  messages,
  isCoachTyping,
}: {
  messages: ChatMessage[];
  isCoachTyping: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isCoachTyping]);

  return (
    <div
      className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-4"
      role="log"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isCoachTyping && <TypingBubble />}
      <div ref={bottomRef} />
    </div>
  );
}
