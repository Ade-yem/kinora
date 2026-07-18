"use client";

import { X, Trash2 } from "lucide-react";
import type { RoutineSummary } from "@/types";
import { useRouter } from "next/navigation";

interface FinalizedRoutinesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  routines: RoutineSummary[];
  activeRoutineId: string;
  onDeleteRoutine: (id: string) => void;
}

function getRelativeDate(updatedAtStr: string, isActive: boolean) {
  if (isActive) return "viewing · today";
  const now = new Date();
  const updated = new Date(updatedAtStr);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
}

export function FinalizedRoutinesSidebar({
  isOpen,
  onClose,
  routines,
  activeRoutineId,
  onDeleteRoutine,
}: FinalizedRoutinesSidebarProps) {
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-surface-card border-l border-ink/8 px-6 py-6 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Your Routines</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Routines List */}
        <div className="mt-8 flex-1 overflow-y-auto space-y-3 hide-scrollbar">
          {routines.map((r) => {
            const isActive = r.id === activeRoutineId;
            return (
              <div
                key={r.id}
                className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                  isActive
                    ? "border-volt/30 bg-volt/10 text-ink"
                    : "border-ink/6 hover:bg-ink/4 text-ink/70 hover:text-ink"
                }`}
              >
                <button
                  onClick={() => {
                    router.push(`/routine/${r.id}`);
                    onClose();
                  }}
                  className="flex-1 text-left cursor-pointer focus:outline-none"
                >
                  <div className="font-display text-sm font-bold truncate">
                    {r.title}
                  </div>
                  <div className={`mt-0.5 text-xs ${isActive ? "text-volt-text font-semibold" : "text-ink/40"}`}>
                    {getRelativeDate(r.updatedAt, isActive)}
                  </div>
                </button>

                {/* Delete button (only show on hover for non-active items, or visible on mobile) */}
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this routine? This action is permanent.")) {
                        onDeleteRoutine(r.id);
                      }
                    }}
                    className="ml-2 rounded-md p-1.5 text-ink/30 hover:bg-error/10 hover:text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    aria-label="Delete routine"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-ink/8 pt-4 mt-4 text-[11px] leading-relaxed text-ink/35">
          Jump between routines or delete old ones anytime.
        </div>
      </aside>
    </>
  );
}
