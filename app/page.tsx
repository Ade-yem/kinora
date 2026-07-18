"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { useEffect } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { logoStyle } = useLogoStyle();
  const profile = useAppStore((s) => s.profile);
  const profileState = useAppStore(s => s.profileStatus);
  const router = useRouter()

  useEffect(() => {
    if (profileState === "loading" || profileState === "error") return
    if (profileState === "loaded" && profile) router.replace("/home");
  }, []);
  
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Logo
          variant={logoStyle}
          size="lg"
          className="shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)] rounded-3xl"
        />
        <h1 className="font-display text-4xl font-bold">Kinora</h1>
        <p className="max-w-xs text-[15px] leading-snug text-ink/60">
          The Coach That Evolves With You.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Button variant="primary" href="/onboarding">
          Get Started
        </Button>
        <Link href="/login" className="text-center text-sm font-semibold text-ink/55">
          Log in
        </Link>
      </div>
    </main>
  );
}
