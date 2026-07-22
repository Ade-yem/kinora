"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgressBar } from "@/components/ui/ProgressDots";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { BiodataStep } from "@/components/onboarding/BiodataStep";
import { useAppStore } from "@/lib/store";

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState(0);

  const { experienceLevel, preferredLocation } = useAppStore((s) => s.onboarding);
  const setExperienceLevel = useAppStore((s) => s.setExperienceLevel);
  const setPreferredLocation = useAppStore((s) => s.setPreferredLocation);
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
      if (profile?.experienceLevel && profile?.preferredLocation) {
        router.push("/home");
      } else {
        setStep(1);
      }
    }
  }, [status, profileStatus, profile, router]);

  if (
    status === "loading" ||
    (status === "authenticated" && profileStatus !== "loaded" && profileStatus !== "error")
  ) {
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

      {step === 0 && <SignupStep />}
      {step === 1 && (
        <BiodataStep
          experienceLevel={experienceLevel}
          preferredLocation={preferredLocation}
          onSelectExperience={setExperienceLevel}
          onSelectLocation={setPreferredLocation}
          onContinue={async () => {
            if (experienceLevel && preferredLocation) {
              await updateProfile({ experienceLevel, preferredLocation });
            }
            router.push("/home");
          }}
        />
      )}
    </main>
  );
}
