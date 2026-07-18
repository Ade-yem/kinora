import { useEffect, useState } from "react";
import { useAppStore } from "./store";
import { useSession } from "next-auth/react";

export type LogoVariant = "pulse-bubble" | "rep-loop" | "signal-bars";

export function useLogoStyle() {
  const { status } = useSession();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [localStyle, setLocalStyle] = useState<LogoVariant>("pulse-bubble");

  // Read initial from localStorage on mount (runs client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kinora_logo_style");
      if (stored === "pulse-bubble" || stored === "rep-loop" || stored === "signal-bars") {
        setLocalStyle(stored);
      }
    }
  }, []);

  // Sync from DB profile if authenticated and profile is loaded
  useEffect(() => {
    if (status === "authenticated" && profile?.logoStyle) {
      if (profile.logoStyle !== localStyle) {
        setLocalStyle(profile.logoStyle);
        localStorage.setItem("kinora_logo_style", profile.logoStyle);
      }
    }
  }, [status, profile?.logoStyle, localStyle]);

  const setLogoStyle = async (newStyle: LogoVariant) => {
    setLocalStyle(newStyle);
    localStorage.setItem("kinora_logo_style", newStyle);
    if (status === "authenticated") {
      try {
        await updateProfile({ logoStyle: newStyle });
      } catch (err) {
        console.error("Failed to sync logo preference to profile", err);
      }
    }
  };

  return { logoStyle: localStyle, setLogoStyle };
}
