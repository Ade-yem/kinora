"use client";

import { useState } from "react";

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      className="flex items-center gap-2.5 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor="chat-input" className="sr-only">
        Message Coach
      </label>
      <input
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Message Coach…"
        className="flex-1 rounded-full border-[1.5px] border-ink/15 px-4 py-3 text-sm placeholder:text-ink/40 focus:border-ink/40 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Send message"
        disabled={!value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-volt text-base disabled:opacity-40"
      >
        <span aria-hidden>🎤</span>
      </button>
    </form>
  );
}
