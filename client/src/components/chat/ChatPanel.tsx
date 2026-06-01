import { useRef, useEffect, useState } from "react";
import { Trash2, Sparkles } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ChatLogo } from "./ChatLogo";

export function ChatPanel() {
  const { isOpen, close, isLoading, error, clear } = useChatStore();
  const { send, messages } = useChat();
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] flex flex-col overflow-hidden transition-all duration-300 ${
        mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      }`}
    >
      {/* Glass container */}
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl shadow-violet-500/10">
        {/* Gradient noise overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-indigo-500/[0.03] pointer-events-none" />

        {/* Header — gradient */}
        <div className="relative shrink-0 bg-gradient-to-r from-violet-600 via-violet-700 to-indigo-800 px-4 py-3.5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMCAwaDEwMHYxMDBIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-5" />
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ChatLogo size={28} />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight">AI Assistant</span>
                <p className="text-[10px] text-white/60 leading-none mt-0.5">Bookkeeping • BIR Forms</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
                  title="New chat"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-[160px] max-h-[360px]"
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-40 text-center animate-in fade-in duration-500">
              <div className="mb-3 p-3 rounded-2xl bg-violet-50">
                <ChatLogo size={40} />
              </div>
              <p className="text-sm font-semibold text-violet-900">
                Ask me about BIR forms
              </p>
              <p className="text-xs text-violet-500/70 mt-1.5 max-w-[200px]">
                Deadlines, form codes, filing frequencies — powered by DeepSeek AI
              </p>
              <div className="flex items-center gap-1 mt-3 text-[10px] text-violet-400/50">
                <Sparkles size={10} />
                <span>Ask anything about Philippine taxes</span>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`animate-in fade-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <MessageBubble
                message={msg}
                isLoading={isLoading && msg.role === "assistant" && msg === messages[messages.length - 1]}
              />
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50/80 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-red-200/50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Input */}
        <InputBar onSend={send} disabled={isLoading} />
      </div>
    </div>
  );
}
