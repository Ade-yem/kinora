"use client";

import { SignupStep } from "@/components/onboarding/SignupStep";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-8">
      <SignupStep />
    </main>
  );
}
