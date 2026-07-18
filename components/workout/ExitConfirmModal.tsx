"use client";

import { Button } from "@/components/ui/Button";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  completedSetsCount: number;
}

export function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirmExit,
  completedSetsCount,
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-surface-ink/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl border border-ink/10 flex flex-col gap-4 text-ink animate-splash-fade-up">
        <div>
          <h2
            id="exit-modal-title"
            className="font-display text-xl font-bold"
          >
            Exit Workout?
          </h2>
          <p className="mt-2 text-sm text-ink/60 leading-relaxed">
            You have completed <strong>{completedSetsCount} set{completedSetsCount === 1 ? "" : "s"}</strong>. 
            If you exit now, we will log your completed sets and save your progress.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            variant="primary"
            onClick={onConfirmExit}
            className="w-full bg-coral text-cream font-bold hover:bg-opacity-95 py-3 cursor-pointer rounded-2xl flex justify-center items-center"
          >
            End & Save Progress
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full bg-ink/5 text-ink font-bold hover:bg-ink/10 py-3 cursor-pointer rounded-2xl flex justify-center items-center"
          >
            Keep Going
          </Button>
        </div>
      </div>
    </div>
  );
}
