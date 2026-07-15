export function AskAiCollapsedBar() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 bg-surface-ink px-6 text-center text-cream">
      <div className="mb-4 w-full max-w-sm rounded-2xl border-[1.5px] border-cream/20 px-4 py-2.5 text-left text-sm text-cream/70">
        <div className="flex items-center justify-between">
          <span>💬 Ask AI anything</span>
          <span aria-hidden>▾</span>
        </div>
      </div>
      <div className="text-3xl" aria-hidden>
        🏃
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-cream/60">
        Chat tucks away — you&apos;re in workout mode now.
        <br />
        <span className="text-volt">Active tracking screen</span> picks up from here.
      </p>
    </main>
  );
}
