"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";

const SETTINGS_ROWS = ["Equipment & Location", "Injuries & Limitations", "Units (kg / lb)", "Notifications"];

export default function ProfilePage() {
  const { data: session } = useRequireAuth();
  const profile = useAppStore((s) => s.profile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName = session?.user?.name ?? session?.user?.email ?? "…";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-volt/25 text-2xl" aria-hidden>
          🙂
        </div>
        <div>
          <div className="font-display text-base font-bold">{displayName}</div>
          <div className="text-xs text-ink/50">Goal: {profile?.goal || "Not set"}</div>
        </div>
      </div>

      <div className="flex flex-col">
        {SETTINGS_ROWS.map((row) => (
          <div
            key={row}
            className="flex items-center justify-between border-b border-ink/8 py-3.5 text-sm font-semibold"
          >
            {row} <span className="text-ink/30">›</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-auto pt-3.5 text-center text-sm font-bold text-error"
      >
        Log out
      </button>
    </main>
  );
}
