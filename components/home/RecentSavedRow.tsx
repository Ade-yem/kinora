import Link from "next/link";
import type { RoutineSummary } from "@/lib/types";

const tileClass =
  "flex flex-1 flex-col items-center justify-center rounded-2xl bg-[repeating-linear-gradient(135deg,oklch(0.22_0.02_60/0.05),oklch(0.22_0.02_60/0.05)_8px,oklch(0.22_0.02_60/0.09)_8px,oklch(0.22_0.02_60/0.09)_16px)] px-2 py-5 text-center text-xs font-semibold text-ink/60";

export function RecentSavedRow({ routines }: { routines: RoutineSummary[] }) {
  if (routines.length === 0) return null;

  return (
    <div>
      <div className="mb-2.5 text-[13px] font-bold text-ink/55">Recent &amp; saved</div>
      <div className="flex gap-2.5">
        {routines.map((routine) => (
          <Link key={routine.id} href={`/routine/${routine.id}`} className={tileClass}>
            {routine.title}
            <br />
            {routine.status === "finalized" ? "✓ done" : routine.status}
          </Link>
        ))}
      </div>
    </div>
  );
}
