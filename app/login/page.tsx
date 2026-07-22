"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { toast } from "sonner";

export default function LoginPage() {
  const { logoStyle } = useLogoStyle();
  /**
   * Logs user in with google without redirect. After that,
   * it checks if the user has been onboarded properly. If not, user is going to the onboarding page
   */
  const handleLogin = async () => {
    toast.loading("Logging you in...", { id: "logging" });
    const res = await signIn("google", { redirect: false });
    if (res?.error) {
      toast.error("res.error")
    } else {
    }
  }
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
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 py-4 cursor-pointer"
            >
              <svg viewBox="-3 0 262 262" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
              Continue with Google
            </Button>
          </div>
        </main>
      );
    }
