import React from "react";

export function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 mb-4 text-sm space-y-1.5 text-ink/75">
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const parseInlineMarkdown = (text: string) => {
    // Match Markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const [full, linkText, url] = match;
      const index = match.index;

      if (index > lastIndex) {
        parts.push(...parseBoldText(text.substring(lastIndex, index)));
      }

      parts.push(
        <a
          key={`link-${index}`}
          href={url}
          className="text-coral hover:underline font-semibold"
          target={url.startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
        >
          {linkText}
        </a>
      );

      lastIndex = index + full.length;
    }

    if (lastIndex < text.length) {
      parts.push(...parseBoldText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : text;
  };

  const parseBoldText = (text: string): React.ReactNode[] => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-bold text-ink">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("* ")) {
      currentList.push(trimmed.substring(2));
      return;
    }

    flushList(index);

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="font-display text-2xl font-bold mt-6 mb-3 text-ink">
          {parseInlineMarkdown(trimmed.substring(2))}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="font-display text-lg font-semibold mt-5 mb-2.5 text-ink/90">
          {parseInlineMarkdown(trimmed.substring(3))}
        </h2>
      );
    } else if (trimmed === "---") {
      elements.push(<hr key={index} className="border-t border-ink/8 my-5" />);
    } else {
      elements.push(
        <p key={index} className="text-sm leading-relaxed text-ink/70 mb-3.5">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList(lines.length);

  return <div className="markdown-body font-sans">{elements}</div>;
}
