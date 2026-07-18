"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, Routine } from "@/types";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, ChevronRight } from "lucide-react";
import { getEquipmentSummary } from "@/lib/utils";

export function ChatThread({
  messages,
  isCoachTyping,
  routine,
  onViewRoutine,
}: {
  messages: ChatMessage[];
  isCoachTyping: boolean;
  routine?: Routine;
  onViewRoutine?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isCoachTyping, routine?.status]);

  return (
    <div
      className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-4 hide-scrollbar"
      role="log"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isCoachTyping && <TypingBubble />}

      {/* Finalized Routine Card inside the scroll stream */}
      {routine && routine.status === "finalized" && (
        <div className="my-2 self-stretch">
          <Card className="border border-volt/30 bg-volt/5 p-5 rounded-2xl flex flex-col gap-3.5">
            <div className="text-volt-text font-display text-[11px] font-bold tracking-wider uppercase">
              <Check className="w-4 h-4"/> Routine Finalized
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {routine.title}
              </h3>
              <p className="text-[13px] text-ink/50 mt-1">
                {routine.exercises.length} exercises · ~{Math.max(15, routine.exercises.length * 7)} min · {getEquipmentSummary(routine.exercises)}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={onViewRoutine}
              className="w-full bg-volt text-volt-text font-bold hover:bg-opacity-90 active:scale-98 transition-all text-sm py-2.5 cursor-pointer flex justify-center items-center gap-1.5"
            >
              View Routine <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="primary"
              href={`/workout/${routine.id}`}
              className="w-full bg-volt text-volt-text font-bold hover:bg-opacity-90 active:scale-98 transition-all text-sm py-2.5 cursor-pointer flex justify-center items-center gap-1.5"
            >
              Go to Workout <ChevronRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
