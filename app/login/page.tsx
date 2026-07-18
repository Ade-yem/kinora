"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";

export default function LoginPage() {
  const { logoStyle } = useLogoStyle();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Logo
          variant={logoStyle}
          size="lg"
          className="shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)] rounded-3xl"
        />
        <h1 className="font-display text-3xl font-bold">Welcome back</h1>
        <p className="max-w-xs text-[15px] leading-snug text-ink/60">
          The Coach That Evolves With You.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Button
          type="button"
          variant="primary"
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          className="flex items-center justify-center gap-2 py-4 cursor-pointer"
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.305-.176-1.859H12.24z" />
          </svg>
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
