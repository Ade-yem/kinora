"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeClosed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { toast } from "sonner";

export default function LoginPage() {
  const { logoStyle } = useLogoStyle();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);

  const handleGoogleLogin = async () => {
    toast.loading("Logging you in...", { id: "logging" });
    const res = await signIn("google", { redirect: false });
    if (res?.error) {
      toast.error(res.error || "Something went wrong", { id: "logging" });
    } else {
      toast.success("Logged in successfully!", { id: "logging" });
      router.replace("/onboarding");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setIsUnverified(false);
    toast.loading("Logging you in...", { id: "logging" });

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.toLowerCase().includes("verify your email")) {
          setIsUnverified(true);
        }
        toast.error(res.error, { id: "logging" });
      } else {
        toast.success("Logged in successfully!", { id: "logging" });
        router.replace("/onboarding");
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "logging" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    setResending(true);
    toast.loading("Resending verification link...", { id: "resend-verify" });
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || "Resend failed. Please try again.", { id: "resend-verify" });
      } else {
        toast.success("Verification link resent! Check your inbox.", { id: "resend-verify" });
        setIsUnverified(false);
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "resend-verify" });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-12">
      <div className="flex flex-1 flex-col justify-center py-6">
        <div className="flex flex-col items-center gap-5 text-center mb-8 animate-splash-fade-up">
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

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 animate-splash-fade-up">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink/50" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-ink/15 px-4 py-3.5 text-sm focus:border-volt focus:outline-none transition-all duration-200 bg-surface-card text-ink"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-coral hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-ink/15 pl-4 pr-12 py-3.5 text-sm focus:border-volt focus:outline-none transition-all duration-200 bg-surface-card text-ink"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeClosed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-2 py-4 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        {isUnverified && (
          <div className="mt-4 p-4 bg-coral/10 border border-coral/20 rounded-2xl text-center animate-splash-fade-up">
            <p className="text-[13px] text-ink/80 mb-2.5">Your email address has not been verified yet.</p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="text-[13px] font-bold text-coral hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend verification email"}
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 my-6 animate-splash-fade-up">
          <div className="h-[1px] flex-1 bg-ink/10"></div>
          <span className="text-[12px] font-semibold text-ink/35 uppercase tracking-widest">or</span>
          <div className="h-[1px] flex-1 bg-ink/10"></div>
        </div>

        <div className="flex flex-col gap-3.5 animate-splash-fade-up">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-4 cursor-pointer bg-surface-card text-ink"
          >
            <svg viewBox="-3 0 262 262" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
            Continue with Google
          </Button>
        </div>
      </div>

      <div className="text-center text-sm font-semibold text-ink/55 animate-splash-fade-up">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-coral hover:underline ml-1">
          Sign up
        </Link>
      </div>
    </main>
  );
}
