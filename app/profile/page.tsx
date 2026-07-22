"use client";


import { useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronRight, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { BottomNav } from "@/components/ui/BottomNav";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";

export default function ProfilePage() {
  const { data: session } = useRequireAuth();
  const profile = useAppStore((s) => s.profile);
  const fetchProfile = useAppStore((s) => s.fetchProfile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const { logoStyle, setLogoStyle } = useLogoStyle();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName = session?.user?.name ?? session?.user?.email ?? "…";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-6 py-6">
      {/* Header Profile Section */}
      <div className="mb-6 flex items-center gap-3">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover shadow-sm border border-ink/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-volt/25 text-2xl" aria-hidden>
            <User className="w-10 h-10" />
          </div>
        )}
        <div>
          <div className="font-display text-base font-bold">{displayName}</div>
          <div className="text-xs text-ink/50">
            Experience: {profile?.experienceLevel ? profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1) : "Not set"}
          </div>
        </div>
      </div>

      {/* Brand Logo Variant Selector */}
      <div className="mb-6 rounded-2xl bg-ink/5 p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink/50">Logo Theme</div>
        <div className="flex gap-2 justify-around">
          {(["pulse-bubble", "rep-loop", "signal-bars"] as const).map((style) => {
            const isSelected = logoStyle === style;
            return (
              <button
                key={style}
                onClick={() => setLogoStyle(style)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-[2px] transition cursor-pointer ${
                  isSelected
                    ? "border-coral bg-surface shadow-sm"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Select ${style} logo theme`}
              >
                <Logo variant={style} size="md" className="rounded-xl shadow-xs" />
                <span className="text-[10px] font-bold capitalize">
                  {style.replace("-", " ")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Rows / Form Fields */}
      <div className="flex flex-col mb-6">
        <Link
          href="/profile/biodata"
          className="flex items-center justify-between border-b border-ink/8 py-4 text-sm font-semibold hover:bg-ink/5 rounded-lg px-2 -mx-2 transition"
        >
          <span>Biodata & Preferences</span>
          <ChevronRight className="h-4 w-4 text-ink/30" />
        </Link>

        <Link
          href="/profile/injuries"
          className="flex items-center justify-between border-b border-ink/8 py-4 text-sm font-semibold hover:bg-ink/5 rounded-lg px-2 -mx-2 transition"
        >
          <span>Injuries & Limitations</span>
          <ChevronRight className="h-4 w-4 text-ink/30" />
        </Link>

        <div className="flex items-center justify-between border-b border-ink/8 py-4 text-sm font-semibold px-2">
          <span>Units (kg / lb)</span>
          <div className="flex bg-ink/8 rounded-lg p-0.5">
            {(["lb", "kg"] as const).map((unit) => {
              const isSelected = (profile?.unitsPreference || "lb") === unit;
              return (
                <button
                  key={unit}
                  onClick={() => updateProfile({ unitsPreference: unit })}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                    isSelected ? "bg-surface text-ink shadow-xs" : "text-ink/40 hover:text-ink"
                  }`}
                >
                  {unit.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log out Button */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-auto pt-3.5 text-center text-sm font-bold text-error cursor-pointer hover:underline"
      >
        Log out
      </button>

      {/* Navigation Bar */}
      <div className="mt-6">
        <BottomNav active="profile" />
      </div>
    </main>
  );
}

