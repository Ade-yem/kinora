"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { RoutinePreviewDocked } from "@/components/chat/RoutinePreviewDocked";
import { RoutinePreviewSheet } from "@/components/chat/RoutinePreviewSheet";
import { AskAiCollapsedBar } from "@/components/chat/AskAiCollapsedBar";
import { ExerciseDetailSheet } from "@/components/chat/ExerciseDetailSheet";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function ChatPage() {
  useRequireAuth();
  const router = useRouter();
  const initChat = useAppStore((s) => s.initChat);
  const resetWorkout = useAppStore((s) => s.resetWorkout);
  const messages = useAppStore((s) => s.chat.messages);
  const previewState = useAppStore((s) => s.chat.previewState);
  const isCoachTyping = useAppStore((s) => s.chat.isCoachTyping);
  const routine = useAppStore((s) => s.routine);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const setPreviewState = useAppStore((s) => s.setPreviewState);
  const finalizeRoutine = useAppStore((s) => s.finalizeRoutine);
  const openExerciseDetail = useAppStore((s) => s.openExerciseDetail);

  useEffect(() => {
    initChat();
    resetWorkout();
  }, [initChat, resetWorkout]);

  useEffect(() => {
    if (previewState !== "finalized") return;
    const timer = window.setTimeout(() => router.push("/workout/active"), 1400);
    return () => window.clearTimeout(timer);
  }, [previewState, router]);

  if (previewState === "finalized") {
    return <AskAiCollapsedBar />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5 lg:max-w-5xl lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
      <div className={`flex min-h-dvh flex-1 flex-col lg:min-h-0 ${previewState === "full-sheet" ? "hidden lg:flex" : "flex"}`}>
        <div className="flex items-center gap-2.5 border-b border-ink/8 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-volt text-sm" aria-hidden>
            ⚡
          </div>
          <span className="font-display text-sm font-bold">Coach</span>
        </div>

        <ChatThread messages={messages} isCoachTyping={isCoachTyping} />
        <ChatInput onSend={sendMessage} />
      </div>

      {routine.status !== "empty" && (
        <aside className="hidden lg:block lg:w-96">
          <RoutinePreviewSheet
            routine={routine}
            onFinalize={finalizeRoutine}
            onSelectExercise={openExerciseDetail}
          />
        </aside>
      )}

      {previewState === "docked" && (
        <RoutinePreviewDocked routine={routine} onExpand={() => setPreviewState("full-sheet")} />
      )}

      {previewState === "full-sheet" && (
        <div className="fixed inset-0 z-10 p-4 lg:hidden">
          <RoutinePreviewSheet
            routine={routine}
            onCollapse={() => setPreviewState("docked")}
            onFinalize={finalizeRoutine}
            onSelectExercise={openExerciseDetail}
          />
        </div>
      )}

      <ExerciseDetailSheet />
    </main>
  );
}
