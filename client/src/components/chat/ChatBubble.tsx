import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import { ChatPanel } from "./ChatPanel";

export function ChatBubble() {
  const { isOpen, toggle } = useChatStore();

  return (
    <>
      <ChatPanel />
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
