  "use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";
import { toast } from "sonner";

function VerifyEmailContent() {
  const { logoStyle } = useLogoStyle();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link. Token and email are required.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
        );
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error?.message || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    verify();
  }, [token, email]);

  const handleResend = async () => {
    if (!email) return;
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
      }
    } catch (err: unknown) {
      toast.error("An unexpected error occurred. Please try again.", { id: "resend-verify" });
    } finally {
      setResending(false);
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
        <h1 className="font-display text-3xl font-bold">Email Verification</h1>
      </div>

      <div className="bg-surface-card border border-ink/15 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-volt animate-spin" />
            <p className="text-[15px] leading-snug text-ink/75">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 rounded-full bg-volt/15 flex items-center justify-center text-volt-text animate-splash-icon-pulse">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <p className="text-[15px] leading-snug text-ink/75 font-medium">{message}</p>
            <div className="w-full mt-2">
              <Button variant="primary" href="/login">
                Log in to Kinora
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 rounded-full bg-coral/15 flex items-center justify-center text-coral-text">
              <X className="h-8 w-8 stroke-[3]" />
            </div>
            <p className="text-[15px] leading-snug text-coral-text font-medium">{message}</p>
            <div className="w-full mt-2 flex flex-col gap-3">
              {email && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleResend}
                  disabled={resending}
                  className="py-4 cursor-pointer"
                >
                  {resending ? "Resending..." : "Resend Verification Email"}
                </Button>
              )}
              <Button variant="outline" href="/signup">
                Sign up again
              </Button>
              <Link href="/login" className="text-sm font-semibold text-ink/55 hover:underline">
                Back to log in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-12 animate-splash-fade-up">
      <Suspense
        fallback={
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-volt animate-spin" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
