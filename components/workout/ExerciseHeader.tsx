import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressDots";

export function ExerciseHeader({
  exerciseIndex,
  total,
}: {
  exerciseIndex: number;
  total: number;
}) {
  return (
    <div className="px-1 pt-1">
      <div className="flex items-center justify-between">
        <Link href="/home" aria-label="Back to Home" className="text-lg text-cream/80">
          ←
        </Link>
        <span className="text-xs font-semibold text-cream/60">
          Exercise {exerciseIndex + 1} of {total}
        </span>
        <Link href="/home" aria-label="End workout" className="text-base text-cream/70">
          ✕
        </Link>
      </div>
      <div className="mt-3.5">
        <ProgressBar
          total={total}
          current={exerciseIndex + 1}
          activeClassName="bg-volt"
          trackClassName="bg-cream/15"
        />
      </div>
    </div>
  );
}
