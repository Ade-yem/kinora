"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Eye, EyeClosed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { toast } from "sonner";

function ResetPasswordContent() {
  const { logoStyle } = useLogoStyle();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!token || !email) {
    return (
      <div className="flex flex-col justify-center py-6">
        <div className="flex flex-col items-center gap-5 text-center mb-8">
          <Logo variant={logoStyle} size="lg" className="rounded-3xl" />
          <h1 className="font-display text-3xl font-bold">Invalid Link</h1>
        </div>
        <div className="bg-surface-card border border-ink/15 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-coral/15 flex items-center justify-center text-coral-text">
            <X className="h-8 w-8 stroke-[3]" />
          </div>
          <p className="text-[15px] leading-snug text-coral-text font-medium">
            This password reset link is invalid or incomplete.
          </p>
          <div className="w-full mt-2">
            <Button variant="primary" href="/forgot-password">
              Request a new link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    toast.loading("Resetting password...", { id: "reset" });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successfully!", { id: "reset" });
        setIsSubmitted(true);
      } else {
        toast.error(data.error?.message || "Failed to reset password.", { id: "reset" });
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "reset" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <div className="flex flex-col items-center gap-5 text-center mb-8">
        <Logo
          variant={logoStyle}
          size="lg"
          className="shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)] rounded-3xl"
        />
        <h1 className="font-display text-3xl font-bold">New Password</h1>
        <p className="max-w-xs text-[15px] leading-snug text-ink/60">
          Enter and confirm your new password below.
        </p>
      </div>

      {isSubmitted ? (
        <div className="bg-surface-card border border-ink/15 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-sm animate-splash-fade-up">
          <div className="h-16 w-16 rounded-full bg-volt/15 flex items-center justify-center text-volt-text animate-splash-icon-pulse">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>
          <p className="text-[15px] leading-snug text-ink/75 font-medium">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <div className="w-full mt-2">
            <Button variant="primary" href="/login">
              Log in to Kinora
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink/50" htmlFor="password">
              New Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink/50" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative w-full">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-ink/15 pl-4 pr-12 py-3.5 text-sm focus:border-volt focus:outline-none transition-all duration-200 bg-surface-card text-ink"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <EyeClosed className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-2 py-4 cursor-pointer"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-12 animate-splash-fade-up">
      <Suspense
        fallback={
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-volt animate-spin" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
