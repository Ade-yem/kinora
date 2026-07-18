import { useEffect, useRef } from "react";

interface WakeLockSentinel {
  released: boolean;
  type: string;
  release: () => Promise<void>;
  onrelease: (() => void) | null;
}

interface NavigatorWakeLock {
  request: (type: "screen") => Promise<WakeLockSentinel>;
}

export function useWakeLock(): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    async function requestWakeLock() {
      if (sentinelRef.current) return;
      try {
        const nav = navigator as unknown as { wakeLock: NavigatorWakeLock };
        const sentinel = await nav.wakeLock.request("screen");
        sentinelRef.current = sentinel;
        sentinel.onrelease = () => {
          sentinelRef.current = null;
        };
      } catch (err) {
        console.error("Failed to acquire wake lock:", err);
      }
    }

    async function releaseWakeLock() {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
        } catch (err) {
          console.error("Failed to release wake lock:", err);
        }
        sentinelRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    }

    requestWakeLock();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, []);
}
