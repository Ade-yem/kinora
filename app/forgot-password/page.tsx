"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { logoStyle } = useLogoStyle();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    toast.loading("Sending reset link...", { id: "forgot" });

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Reset link sent if account exists.", { id: "forgot" });
        setIsSubmitted(true);
      } else {
        toast.error(data.error?.message || "Failed to send reset link.", { id: "forgot" });
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "forgot" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    toast.loading("Resending reset link...", { id: "forgot" });
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Reset link resent successfully!", { id: "forgot" });
      } else {
        toast.error(data.error?.message || "Failed to send reset link.", { id: "forgot" });
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "forgot" });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-12 animate-splash-fade-up">
      <div className="flex flex-1 flex-col justify-center py-6">
        <div className="flex flex-col items-center gap-5 text-center mb-8">
          <Logo
            variant={logoStyle}
            size="lg"
            className="shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)] rounded-3xl"
          />
          <h1 className="font-display text-3xl font-bold">Reset Password</h1>
          <p className="max-w-xs text-[15px] leading-snug text-ink/60">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-surface-card border border-ink/15 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-volt/15 flex items-center justify-center text-volt-text animate-splash-icon-pulse">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <p className="text-[15px] leading-snug text-ink/75">
              If an account is associated with <strong className="text-ink font-semibold">{email}</strong>, a password reset link has been sent. Please check your inbox.
            </p>
            <div className="w-full mt-2 flex flex-col gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={handleResend}
                disabled={resending}
                className="py-4 cursor-pointer"
              >
                {resending ? "Resending..." : "Resend Link"}
              </Button>
              <Button variant="outline" href="/login">
                Back to log in
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="mt-2 py-4 cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </div>

      <div className="text-center text-sm font-semibold text-ink/55">
        <Link href="/login" className="text-coral hover:underline">
          Back to log in
        </Link>
      </div>
    </main>
  );
}
