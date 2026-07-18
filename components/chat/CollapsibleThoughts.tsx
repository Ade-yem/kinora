"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function CollapsibleThoughts({ thoughts }: { thoughts: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!thoughts) return null;

  const lines = thoughts.trim().split("\n");
  const lastMessage = lines[lines.length - 1] || "";

  return (
    <div className="my-2 self-start w-full max-w-sm rounded-2xl border border-ink/10 bg-ink/4 p-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/60 hover:text-ink/80 transition-colors"
      >
        <ChevronRight 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} 
        />
        <span>Thinking</span>
      </button>

      {!isOpen && lastMessage && (
        <div className="pl-5.5 mt-1 text-[11px] text-ink/50 font-mono truncate">
          {lastMessage}
        </div>
      )}

      {isOpen && (
        <div className="pl-5.5 mt-2.5 max-h-52 overflow-y-auto border-t border-ink/8 pt-2.5 font-mono text-[11px] leading-relaxed text-ink/70 whitespace-pre-wrap">
          {thoughts}
        </div>
      )}
    </div>
  );
}
