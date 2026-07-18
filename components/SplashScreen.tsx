"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useLogoStyle } from "@/lib/useLogoStyle";

export function SplashScreen() {
  const { logoStyle } = useLogoStyle();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasShown = sessionStorage.getItem("kinora_splash_shown");
    if (!hasShown) {
      setMounted(true);
      setVisible(true);

      // Trigger fade out after 2.6 seconds
      const fadeTimer = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("kinora_splash_shown", "true");
      }, 2600);

      // Unmount completely after fade transition completes (3.1 seconds total)
      const unmountTimer = setTimeout(() => {
        setMounted(false);
      }, 3100);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, []);

  if (!mounted) return null;

  const letterDelay = (delay: number) => ({
    animationDelay: `${delay}s`,
  });

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col justify-between bg-surface-ink text-cream py-16 overflow-hidden transition-opacity duration-500 ease-in-out ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Loading Kinora"
      role="dialog"
      aria-modal="true"
    >
      {/* Background floating decor */}
      <div className="absolute top-[70px] left-[28px] width-[46px] height-[46px] w-12 h-12 rounded-2xl bg-volt/18 animate-splash-float" />
      <div className="absolute bottom-[120px] right-[24px] w-9 h-9 rounded-full bg-coral/22 animate-splash-float-2" />
      <div
        className="absolute top-[200px] right-[44px] w-5 h-5 rounded-md bg-cream/8 animate-splash-float"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Clock marker space matching mock */}
      <div className="flex justify-between px-8 text-xs font-semibold opacity-70">
        <span>9:41</span>
        <span>●●●●</span>
      </div>

      {/* Main Logo & Title */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative animate-splash-icon-in">
          <div className="animate-splash-icon-pulse">
            <Logo variant={logoStyle} size="lg" className="rounded-3xl shadow-lg" />
          </div>
        </div>

        {/* Title: Kinora with animated letters */}
        <div className="flex font-display text-4xl font-bold tracking-wide">
          <span className="animate-splash-fade-up" style={letterDelay(0.35)}>K</span>
          <span className="animate-splash-fade-up" style={letterDelay(0.40)}>i</span>
          <span className="animate-splash-fade-up" style={letterDelay(0.45)}>n</span>
          <span className="animate-splash-fade-up text-volt" style={letterDelay(0.50)}>o</span>
          <span className="animate-splash-fade-up" style={letterDelay(0.55)}>r</span>
          <span className="animate-splash-fade-up" style={letterDelay(0.60)}>a</span>
        </div>

        <div
          className="text-sm font-medium text-cream/55 animate-splash-fade-up"
          style={{ animationDelay: "0.85s" }}
        >
          warming up your coach…
        </div>
      </div>

      {/* Progress Bar Footer */}
      <div className="px-10 shrink-0">
        <div className="h-1 w-full rounded-full bg-cream/15 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-volt to-coral animate-splash-bar-fill" />
        </div>
      </div>
    </div>
  );
}
