"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function PWARegistration() {
  const flushPendingWorkoutLogs = useAppStore((s) => s.flushPendingWorkoutLogs);

  useEffect(() => {
    // Flush on mount (client-side)
    flushPendingWorkoutLogs();

    const handleOnline = () => {
      flushPendingWorkoutLogs();
    };

    window.addEventListener("online", handleOnline);

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [flushPendingWorkoutLogs]);

  return null;
}
