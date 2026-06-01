import { useChatStore } from "@/stores/chat-store";
import { ChatPanel } from "./ChatPanel";
import { ChatLogo } from "./ChatLogo";

export function ChatBubble() {
  const { isOpen, toggle } = useChatStore();

  return (
    <>
      <ChatPanel />
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <ChatLogo size={28} />
          )}
        </div>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>
    </>
  );
}
