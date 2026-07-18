"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";

export function SignupStep() {
  const { logoStyle } = useLogoStyle();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-1 flex-col justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Logo
          variant={logoStyle}
          size="lg"
          className="shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)] rounded-3xl"
        />
        <h1 className="font-display text-3xl font-bold">Create your account</h1>
        <p className="max-w-xs text-[15px] leading-snug text-ink/60">
          Sync your training routines and track progress securely using Google login.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <label className="flex items-start gap-3 cursor-pointer select-none group text-left px-1">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
              style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
            />
            <div
              className={`h-5 w-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                agreed
                  ? "border-volt bg-volt text-surface"
                  : "border-ink/20 bg-surface group-hover:border-volt/65"
              }`}
            >
              <Check
                className={`h-3.5 w-3.5 stroke-[3] transition-transform duration-200 ${
                  agreed ? "scale-100" : "scale-0"
                }`}
              />
            </div>
          </div>
          <span className="text-[13px] leading-snug text-ink/65">
            I agree to the{" "}
            <Link href="/terms" className="text-coral font-semibold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-coral font-semibold hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <Button
          type="button"
          variant="primary"
          onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
          disabled={!agreed}
          className="flex items-center justify-center gap-2 py-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg viewBox="-3 0 262 262" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
