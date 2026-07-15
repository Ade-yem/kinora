"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { apiPost, ApiClientError } from "@/lib/api-client";

export function SignupStep({ onContinue }: { onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiPost("/api/auth/register", { email, password });
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Registered, but sign-in failed — try logging in.");
        return;
      }
      onContinue();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setError("That email is already registered.");
      } else {
        setError("Something went wrong — try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-6 font-display text-2xl font-bold">Create your account</h1>

      <form className="flex flex-1 flex-col gap-4" onSubmit={submitForm}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border-b-[1.5px] border-ink/20 bg-transparent px-0.5 py-1.5 text-sm placeholder:text-ink/35 focus:border-ink/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border-b-[1.5px] border-ink/20 bg-transparent px-0.5 py-1.5 text-sm placeholder:text-ink/35 focus:border-ink/50 focus:outline-none"
          />
        </div>

        {error && (
          <div className="text-xs font-semibold text-error" role="alert">
            {error}
          </div>
        )}

        <Button type="submit" variant="dark" className="mt-auto" disabled={submitting}>
          Continue
        </Button>
      </form>
    </div>
  );
}
