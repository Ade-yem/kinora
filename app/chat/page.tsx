"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSessionsDrawer } from "@/components/chat/ChatSessionsDrawer";
import { RoutinePreviewDocked } from "@/components/chat/RoutinePreviewDocked";
import { RoutinePreviewSheet } from "@/components/chat/RoutinePreviewSheet";
import { ExerciseDetailSheet } from "@/components/chat/ExerciseDetailSheet";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function ChatPage() {
  useRequireAuth();
  const router = useRouter();
  
  // Local UI State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Store actions & state
  const initChat = useAppStore((s) => s.initChat);
  const resetWorkout = useAppStore((s) => s.resetWorkout);
  const fetchSessions = useAppStore((s) => s.fetchSessions);
  const createSession = useAppStore((s) => s.createSession);
  const deleteSession = useAppStore((s) => s.deleteSession);
  
  const sessions = useAppStore((s) => s.chat.sessions);
  const activeSessionId = useAppStore((s) => s.chat.chatSessionId);
  const messages = useAppStore((s) => s.chat.messages);
  const previewState = useAppStore((s) => s.chat.previewState);
  const isCoachTyping = useAppStore((s) => s.chat.isCoachTyping);
  const routine = useAppStore((s) => s.routine);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const setPreviewState = useAppStore((s) => s.setPreviewState);
  const finalizeRoutine = useAppStore((s) => s.finalizeRoutine);
  const openExerciseDetail = useAppStore((s) => s.openExerciseDetail);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionIdParam = searchParams.get("sessionId");

    let resolvedSessionId: string | undefined;

    if (sessionIdParam) {
      // Direct navigation or refresh with parameter
      resolvedSessionId = sessionIdParam;
      sessionStorage.setItem("active_chat_session_id", sessionIdParam);
      // Clean up URL parameter to keep it clean
      router.replace("/chat");
    } else {
      // Read from session storage if available
      const stored = sessionStorage.getItem("active_chat_session_id");
      if (stored) {
        resolvedSessionId = stored;
      }
    }

    initChat(resolvedSessionId);
    fetchSessions();
    resetWorkout();
  }, [initChat, fetchSessions, resetWorkout, router]);

  // Synchronize active session ID to sessionStorage (keeps session storage updated on drawer switches)
  useEffect(() => {
    if (activeSessionId) {
      sessionStorage.setItem("active_chat_session_id", activeSessionId);
    }
  }, [activeSessionId]);

  // Find the active session object to display its title
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-row overflow-hidden lg:max-w-7xl lg:px-6 lg:py-6 lg:gap-6">
      {/* Sidebar/Drawer */}
      <ChatSessionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={(id) => initChat(id)}
        onCreateSession={createSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Chat Area */}
      <div
        className={`flex h-full flex-1 flex-col overflow-hidden bg-surface lg:rounded-3xl lg:border lg:border-ink/8 ${
          previewState === "full-sheet" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center gap-2 border-b border-ink/8 px-5 py-3.5 shrink-0">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden p-1 mr-1 text-ink hover:bg-ink/5 rounded-lg cursor-pointer"
            aria-label="Open chats list"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-volt text-xs" aria-hidden>
            ⚡
          </div>
          <span className="font-display text-sm font-bold truncate">
            {activeSession?.title}
          </span>
        </div>

        {/* Messages scroll list */}
        <ChatThread
          messages={messages}
          isCoachTyping={isCoachTyping}
          routine={routine}
          onViewRoutine={() => setPreviewState("full-sheet")}
        />

        {/* Pinned preview dock & input at the bottom */}
        <div className="shrink-0 border-t border-ink/8 px-5">
          {previewState === "docked" && (
            <div className="pt-2">
              <RoutinePreviewDocked routine={routine} onExpand={() => setPreviewState("full-sheet")} />
            </div>
          )}
          <ChatInput onSend={sendMessage} />
        </div>
      </div>

      {/* Desktop Routine Sidebar Preview */}
      {routine.status !== "empty" && (
        <aside className="hidden lg:block lg:w-96 shrink-0 overflow-y-auto">
          <RoutinePreviewSheet
            routine={routine}
            onFinalize={finalizeRoutine}
            onSelectExercise={openExerciseDetail}
          />
        </aside>
      )}

      {/* Mobile Routine Full Sheet Overlay */}
      {previewState === "full-sheet" && (
        <div className="fixed inset-0 z-55 p-4 bg-ink/20 backdrop-blur-xs lg:hidden">
          <RoutinePreviewSheet
            routine={routine}
            onCollapse={() => setPreviewState(routine.status === "finalized" ? "finalized" : "docked")}
            onFinalize={finalizeRoutine}
            onSelectExercise={openExerciseDetail}
          />
        </div>
      )}

      <ExerciseDetailSheet />
    </main>
  );
}
