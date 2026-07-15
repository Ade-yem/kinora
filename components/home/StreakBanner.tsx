export function StreakBanner({ days }: { days: number }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-coral/30 bg-coral/14 px-4 py-3">
      <span className="text-xl" aria-hidden>
        🔥
      </span>
      <span className="text-sm font-semibold">{days}-day streak — don&apos;t break it!</span>
    </div>
  );
}
