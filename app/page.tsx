import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-between px-8 py-16">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div
          className="flex h-[74px] w-[74px] items-center justify-center rounded-3xl bg-volt text-4xl shadow-[0_10px_24px_-6px_oklch(0.78_0.19_130_/_0.4)]"
          aria-hidden
        >
          ⚡
        </div>
        <h1 className="font-display text-4xl font-bold">RepRally</h1>
        <p className="max-w-xs text-[15px] leading-snug text-ink/60">
          Your AI training partner.
          <br />
          Talk it out, watch your workout build.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Button variant="primary" href="/onboarding">
          Get Started
        </Button>
        <Link href="/login" className="text-center text-sm font-semibold text-ink/55">
          Log in
        </Link>
      </div>
    </main>
  );
}
