"use client";

import { Send, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ChatInput({
  onSend,
  initialValue = "",
}: {
  onSend: (text: string) => void;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [initialValue]);

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

  const showFeedbackChips = value.startsWith("feedback:");

  const handleChipClick = (feedbackText: string) => {
    setValue(`The workout felt ${feedbackText.toLowerCase()}.`);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <div className="flex flex-col w-full">
      {showFeedbackChips && (
        <div className="flex gap-2 mb-1.5 overflow-x-auto hide-scrollbar py-1">
          <button
            type="button"
            onClick={() => handleChipClick("Too easy")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-volt bg-volt/10 text-volt-text hover:bg-volt/25 active:scale-95 transition-all cursor-pointer"
          >
            Too easy
          </button>
          <button
            type="button"
            onClick={() => handleChipClick("Just right")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-ink/20 bg-ink/5 text-ink hover:bg-ink/10 active:scale-95 transition-all cursor-pointer"
          >
            Just right
          </button>
          <button
            type="button"
            onClick={() => handleChipClick("Too hard")}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-coral bg-coral/10 text-coral-text hover:bg-coral/25 active:scale-95 transition-all cursor-pointer"
          >
            Too hard
          </button>
        </div>
      )}
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
    </div>
  );
}
