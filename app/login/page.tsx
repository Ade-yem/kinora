"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(true);
      return;
    }

    setSubmitting(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError(true);
      return;
    }

    setError(false);
    router.push("/home");
  }

  const fieldClass = `w-full border-b-[1.5px] bg-transparent px-0.5 py-1.5 text-sm focus:outline-none ${
    error ? "border-error" : "border-ink/20 focus:border-ink/50"
  }`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-8 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold">Welcome back</h1>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="sr-only">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={fieldClass}
          />
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-error" role="alert">
            <span aria-hidden>⚠</span> Check your email and password
          </div>
        )}

        <div className="text-right text-xs font-semibold text-coral-text">Forgot password?</div>

        <Button type="submit" variant="primary" className="mt-auto" disabled={submitting}>
          Log In
        </Button>
        <p className="text-center text-[13px] text-ink/50">
          No account?{" "}
          <Link href="/onboarding" className="font-semibold text-coral-text">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
