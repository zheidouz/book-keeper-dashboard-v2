import { Bot, User } from "lucide-react";
import type { ChatMessage } from "@/types";
import type { ReactNode } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

/**
 * Render markdown-like text as React elements.
 * Supports **bold**, `code`, - lists, and newlines.
 * Avoids dangerouslySetInnerHTML to prevent minification issues with __html.
 */
function renderMarkdown(text: string): ReactNode[] {
  const segments: ReactNode[] = [];
  const safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = safeText.split("\n");
  let listItems: ReactNode[] = [];

  function flushList(key: string) {
    if (listItems.length > 0) {
      segments.push(<ul key={key}>{listItems}</ul>);
      listItems = [];
    }
  }

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const listMatch = line.match(/^\s*-\s+(.+)/);

    if (listMatch) {
      listItems.push(<li key={`li-${li}`}>{renderInline(listMatch[1])}</li>);
    } else {
      flushList(`ul-${li}`);
      if (li > 0) {
        segments.push(<br key={`br-${li}`} />);
      }
      segments.push(<span key={`line-${li}`}>{renderInline(line)}</span>);
    }
  }

  flushList("ul-end");

  return segments;
}

/** Render inline formatting: **bold** and `code` */
function renderInline(text: string): ReactNode[] {
  // Split on **bold** and `code` patterns, preserving the delimiters
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]?.startsWith("**")) {
      // Bold
      parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // Inline code
      parts.push(
        <code key={`c-${match.index}`} className="bg-muted/60 px-1 rounded text-xs">
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-violet-100 text-violet-600"
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/60 text-foreground rounded-tl-sm"
        }`}
      >
        {message.content ? (
          <span>{renderMarkdown(message.content)}</span>
        ) : isLoading ? (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
