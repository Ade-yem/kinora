import Link from "next/link";
import { Home, MessageSquare, BarChart2, User } from "lucide-react";
import type { ComponentType } from "react";

type NavKey = "home" | "chat" | "progress" | "profile";

interface NavItem {
  key: NavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

const ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: Home, href: "/home" },
  { key: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
  { key: "progress", label: "Progress", icon: BarChart2, href: "/progress" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="flex justify-around border-t border-ink/8 pt-3.5" aria-label="Primary">
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        const className = `flex flex-col items-center gap-1 text-[11px] font-bold ${
          isActive ? "text-coral-text" : "text-ink/40"
        }`;
        const Icon = item.icon;
        return (
          <Link key={item.key} href={item.href} className={className} aria-current={isActive ? "page" : undefined}>
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

