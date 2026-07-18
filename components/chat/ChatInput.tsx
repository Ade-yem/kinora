"use client";

import { Send, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate scrollHeight accurately
    textarea.style.height = "auto";
    // Set to scrollHeight
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <form
      className="flex items-end gap-2.5 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="chat-input" className="sr-only hide-scrollbar">
        Message Coach
      </label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Message Coach…"
        className="flex-1 resize-none rounded-2xl border-[1.5px] border-ink/15 px-4 py-[11px] text-sm placeholder:text-ink/40 focus:border-ink/40 focus:outline-none max-h-40 min-h-[44px] overflow-y-auto leading-relaxed bg-transparent"
      />
      <button
        type="submit"
        aria-label={value.trim() ? "Send message" : "Voice input"}
        onClick={(e) => {
          if (!value.trim()) {
            e.preventDefault();
            alert("Voice coaching is coming soon! For now, please type your message.");
          }
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-volt text-base text-volt-text hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
      >
        <span aria-hidden>
          {value.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </span>
      </button>
    </form>
  );
}
