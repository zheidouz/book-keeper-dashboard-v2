import type { ChatMessage } from "@/types";
import type { ReactNode } from "react";
import { ChatLogo } from "./ChatLogo";

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

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
      segments.push(<ul key={key} className="space-y-0.5">{listItems}</ul>);
      listItems = [];
    }
  }

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const listMatch = line.match(/^\s*-\s+(.+)/);

    if (listMatch) {
      listItems.push(<li key={`li-${li}`} className="text-inherit">{renderInline(listMatch[1])}</li>);
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

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]?.startsWith("**")) {
      parts.push(<strong key={`b-${match.index}`} className="font-semibold">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={`c-${match.index}`} className="bg-black/5 px-1.5 rounded text-xs font-mono">
          {match[3]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 ${
          isUser
            ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-violet-300/30"
            : "bg-gradient-to-br from-violet-50 to-indigo-100"
        }`}
      >
        {isUser ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <ChatLogo size={16} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow duration-200 hover:shadow-md ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-sm"
            : "bg-white/80 backdrop-blur-sm border border-violet-100/50 text-slate-800 rounded-tl-sm"
        }`}
      >
        {message.content ? (
          <div className="[&_strong]:text-inherit [&_code]:text-xs space-y-1">{renderMarkdown(message.content)}</div>
        ) : isLoading ? (
          <span className="inline-flex items-center gap-1 h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-current/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-current/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-current/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
