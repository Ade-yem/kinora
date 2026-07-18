import React from "react";

export function RichText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const parseInline = (str: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = str.split(regex);

    parts.forEach((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        tokens.push(
          <code
            key={index}
            className="rounded bg-volt/15 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-volt-text"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else if (part.startsWith("**") && part.endsWith("**")) {
        tokens.push(
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("*") && part.endsWith("*")) {
        tokens.push(
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      } else {
        tokens.push(part);
      }
    });

    return tokens;
  };

  lines.forEach((line, i) => {
    let trimmed = line.trim();
    if (trimmed.includes("<<GUARDRAIL>>")) {
      // replace "<<GUARDRAIL>>" text with a caution emoji ⚠️
      trimmed = trimmed.replaceAll("<<GUARDRAIL>>", "⚠️");
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = line.substring(line.indexOf(" ") + 1);
      currentList.push(
        <li key={`li-${i}`} className="ml-5 list-disc pl-1 my-0.5 leading-relaxed opacity-90">
          {parseInline(content)}
        </li>
      );
    } else {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${i}`} className="my-2 space-y-0.5">
            {currentList}
          </ul>
        );
        currentList = [];
      }
      if (trimmed === "") {
        elements.push(<div key={`br-${i}`} className="h-2.5" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="my-1.5 leading-relaxed opacity-95 first:mt-0 last:mb-0">
            {parseInline(line)}
          </p>
        );
      }
    }
  });

  if (currentList.length > 0) {
    elements.push(
      <ul key="ul-final" className="my-2 space-y-0.5">
        {currentList}
      </ul>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}
