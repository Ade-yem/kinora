"use client";

import { X, Plus, Trash2 } from "lucide-react";
import type { ChatSessionInfo } from "@/lib/store/chatSlice";

interface ChatSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionInfo[];
  activeSessionId: string | null;
  onSwitchSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

function getRelativeDate(updatedAtStr: string, isActive: boolean) {
  const now = new Date();
  const updated = new Date(updatedAtStr);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let timeText = "";
  if (diffMins < 60) {
    timeText = `${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    timeText = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    timeText = "yesterday";
  } else if (diffDays < 7) {
    timeText = `${diffDays} days ago`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    timeText = `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  return isActive ? `active · ${timeText}` : timeText;
}

export function ChatSessionsDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSwitchSession,
  onCreateSession,
  onDeleteSession,
}: ChatSessionsDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-surface-card border-r border-ink/8 px-6 py-6 transition-transform duration-300 ease-out lg:static lg:flex lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Chats</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Create Session Button */}
        <button
          onClick={() => {
            onCreateSession();
            onClose();
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-volt py-3 text-sm font-bold text-volt-text hover:bg-opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>

        {/* Sessions List */}
        <div className="mt-6 flex-1 overflow-y-auto space-y-2.5 hide-scrollbar">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                  isActive
                    ? "border-volt/30 bg-volt/10 text-ink"
                    : "border-ink/6 hover:bg-ink/4 text-ink/70 hover:text-ink"
                }`}
              >
                <button
                  onClick={() => {
                    onSwitchSession(session.id);
                    onClose();
                  }}
                  className="flex-1 text-left cursor-pointer focus:outline-none"
                >
                  <div className="font-display text-sm font-bold truncate">
                    {session.title || "New Chat"}
                  </div>
                  <div className={`mt-0.5 text-xs ${isActive ? "text-volt-text" : "text-ink/40"}`}>
                    {getRelativeDate(session.updatedAt, isActive)}
                  </div>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this chat session? This will also remove its unfinalized draft routine.")) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="ml-2 rounded-md p-1.5 text-ink/30 hover:bg-error/10 hover:text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                  aria-label="Delete chat session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Warning */}
        <div className="border-t border-ink/8 pt-4 mt-4 text-[11px] leading-relaxed text-ink/35">
          Deleting a chat also removes its unfinalized draft routine.
        </div>
      </aside>
    </>
  );
}
