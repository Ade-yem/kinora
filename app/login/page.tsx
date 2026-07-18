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

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/10"></div>
          </div>
          <span className="relative bg-[#faf8f5] px-3 text-[11px] text-ink/35 font-bold uppercase tracking-wider">
            or
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: "/home" })}
          className="flex items-center justify-center gap-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.2662 9.7651c-.2603-.7809-.4062-1.616-.4062-2.4851s.146-1.7042.4062-2.4851L1.229 1.698C.4402 3.2764 0 5.0441 0 6.9c0 1.856.4402 3.6236 1.229 5.202l4.0372-2.3369z"
            />
            <path
              fill="#FBBC05"
              d="M16.0409 16.1264c-1.378.8962-3.072 1.4136-4.9c1.4136 0-9.1409 0-9.1409 0l-4.0372 2.3369c2.1859 4.3734 6.7441 7.3767 12.0372 7.3767 3.5136 0 6.7118-1.229 9.1764-3.2662l-4.0355-3.1174z"
            />
            <path
              fill="#34A853"
              d="M12.0372 4.2c2.0291 0 3.8618.7009 5.3018 2.0836l3.9682-3.9682C18.8955.9382 15.6391 0 12.0372 0 6.7441 0 2.1859 3.0033 0 7.3767l4.0372 2.3369c.9272-2.41 3.2045-4.2 5.9682-4.2z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.2727c0-.8182-.0727-1.6091-.2091-2.3727H12.0372v4.5h6.4227c-.2773 1.4636-1.1 2.7045-2.3409 3.5409l4.0355 3.1174c2.3618-2.1773 3.7318-5.3818 3.7318-9.0091z"
            />
          </svg>
          Continue with Google
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
