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
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.305-.176-1.859H12.24z" />
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
