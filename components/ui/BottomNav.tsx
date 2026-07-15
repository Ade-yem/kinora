import Link from "next/link";

type NavKey = "home" | "chat" | "progress";

const ITEMS: { key: NavKey; label: string; icon: string; href: string }[] = [
  { key: "home", label: "Home", icon: "🏠", href: "/home" },
  { key: "chat", label: "Chat", icon: "💬", href: "/chat" },
  { key: "progress", label: "Progress", icon: "📈", href: "/progress" },
];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="flex justify-around border-t border-ink/8 pt-3.5" aria-label="Primary">
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        const className = `flex flex-col items-center gap-1 text-[11px] font-bold ${
          isActive ? "text-coral-text" : "text-ink/40"
        }`;
        return (
          <Link key={item.key} href={item.href} className={className} aria-current={isActive ? "page" : undefined}>
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
