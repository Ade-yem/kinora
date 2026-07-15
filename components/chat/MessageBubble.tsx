import type { ChatMessage } from "@/lib/types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="max-w-[78%] self-end rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-sm text-cream">
        {message.text}
      </div>
    );
  }

  if (message.kind === "guardrail") {
    return (
      <div className="flex max-w-[85%] flex-col gap-2 self-start">
        <div className="rounded-2xl rounded-tl-md border border-coral/35 bg-coral/12 px-3.5 py-3 text-sm leading-snug text-ink">
          {message.text}
        </div>
        {message.chip && (
          <div className="self-start rounded-2xl border-[1.5px] border-dashed border-coral/50 px-3 py-2 text-xs font-semibold text-coral-text">
            {message.chip}
          </div>
        )}
      </div>
    );
  }

  if (message.kind === "patch") {
    return (
      <div className="max-w-[78%] self-start rounded-2xl rounded-tl-md border border-volt/40 bg-volt/10 px-3.5 py-2.5 text-sm font-semibold text-volt-text">
        {message.text}
      </div>
    );
  }

  return (
    <div className="max-w-[78%] self-start rounded-2xl rounded-tl-md bg-ink/6 px-3.5 py-2.5 text-sm leading-snug text-ink">
      {message.text}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div
      className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-tl-md bg-ink/6 px-4 py-3"
      role="status"
      aria-label="Coach is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
