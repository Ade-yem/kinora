"use client"
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressDots";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ExerciseHeader({
  exerciseIndex,
  total,
}: {
  exerciseIndex: number;
  total: number;
}) {
  const router = useRouter()
  return (
    <div className="px-1 pt-1">
      <div className="flex items-center justify-between">
        <div onClick={() => router.back()} aria-label="Back to Home" className="text-lg text-cream/80">
          <ChevronLeft className="w-5 h-5"/>
        </div>
        <span className="text-xs font-semibold text-cream/60">
          Exercise {exerciseIndex + 1} of {total}
        </span>
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
