import type { ChatMessage } from "@/types";
import { RichText } from "./RichText";
import { CollapsibleThoughts } from "./CollapsibleThoughts";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const { data: session } = useSession();

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-2.5 max-w-[82%] self-end">
        <div className="rounded-2xl rounded-tr-md bg-ink px-3.5 py-2.5 text-sm text-cream">
          <RichText text={message.text} />
        </div>
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-7 w-7 rounded-full object-cover border border-ink/10 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-volt/25 text-[11px] font-bold shrink-0">
            <User className="w-7 h-7 text-ink p-1" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 self-start w-full">
      {message.thoughts && <CollapsibleThoughts thoughts={message.thoughts} />}

      {message.kind === "guardrail" ? (
        <div className="flex max-w-[85%] flex-col gap-2">
          <div className="rounded-2xl rounded-tl-md border border-coral/35 bg-coral/12 px-3.5 py-3 text-sm leading-snug text-ink">
            <RichText text={message.text} />
          </div>
          {message.chip && (
            <div className="self-start rounded-2xl border-[1.5px] border-dashed border-coral/50 px-3 py-2 text-xs font-semibold text-coral-text">
              {message.chip}
            </div>
          )}
        </div>
      ) : message.kind === "patch" ? (
        <div className="max-w-[78%] rounded-2xl rounded-tl-md border border-volt/40 bg-volt/10 px-3.5 py-2.5 text-sm font-semibold text-volt-text">
          <RichText text={message.text} />
        </div>
      ) : message.text ? (
        <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-ink/6 px-3.5 py-2.5 text-sm leading-snug text-ink">
          <RichText text={message.text} />
        </div>
      ) : null}
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
