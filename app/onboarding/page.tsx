"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgressBar } from "@/components/ui/ProgressDots";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { GoalStep } from "@/components/onboarding/GoalStep";
import { useAppStore } from "@/lib/store";

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState(0);

  const { goal } = useAppStore((s) => s.onboarding);
  const setGoal = useAppStore((s) => s.setGoal);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);
  const profile = useAppStore((s) => s.profile);
  const profileStatus = useAppStore((s) => s.profileStatus);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, fetchProfile]);

  useEffect(() => {
    if (status === "authenticated" && profileStatus === "loaded") {
      if (profile?.goal) {
        router.push("/chat");
      } else {
        setStep(1);
      }
    }
  }, [status, profileStatus, profile, router]);

  if (status === "loading" || (status === "authenticated" && profileStatus === "loading")) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink/10 border-t-volt"></div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-8">
      <div className="mb-6">
        <ProgressBar total={TOTAL_STEPS} current={step + 1} />
      </div>

      {step === 0 && <SignupStep onContinue={() => setStep(1)} />}
      {step === 1 && (
        <GoalStep
          goal={goal}
          onSelect={setGoal}
          onContinue={async () => {
            if (goal) await updateProfile({ goal });
            router.push("/chat");
          }}
        />
      )}
    </main>
  );
}
