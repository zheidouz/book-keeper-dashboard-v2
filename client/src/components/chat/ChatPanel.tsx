import { useRef, useEffect } from "react";
import { X, Bot, Trash2 } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { useChat } from "@/hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";

export function ChatPanel() {
  const { isOpen, close, isLoading, error, clear } = useChatStore();
  const { send, messages } = useChat();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[500px] flex flex-col rounded-2xl border border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-violet-600" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="New chat"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin min-h-[120px]">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Bot size={32} className="text-violet-300 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Ask me about BIR forms
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Deadlines, form codes, filing frequencies
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLoading={isLoading && msg.role === "assistant" && msg === messages[messages.length - 1]}
          />
        ))}
        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <InputBar onSend={send} disabled={isLoading} />
    </div>
  );
}
