import { useChatStore } from "@/stores/chat-store";
import { chatApi } from "@/lib/api";
import type { ChatMessage } from "@/types";

export function useChat() {
  const messages = useChatStore((s) => s.messages);
  const { addMessage, appendToken, setLoading, setError } = useChatStore();

  async function send(message: string) {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setLoading(true);

    let assistantId: string | null = null;

    try {
      // Read fresh messages from store to avoid stale closure
      const currentMessages = useChatStore.getState().messages;
      const history = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      assistantId = crypto.randomUUID();
      addMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });

      await chatApi.sendStream(message, history, {
        onToken: (token) => appendToken(token),
        onDone: () => setLoading(false),
        onError: (err) => {
          removeEmptyMessage(assistantId!);
          setError(err.message);
        },
      });
    } catch (err: any) {
      removeEmptyMessage(assistantId);
      setError(err.message || "Failed to send message");
    }

    function removeEmptyMessage(id: string | null) {
      if (!id) return;
      const msgs = useChatStore.getState().messages;
      const filtered = msgs.filter((m) => m.id !== id);
      if (filtered.length !== msgs.length) {
        useChatStore.setState({ messages: filtered });
      }
    }
  }

  return { send, messages: useChatStore((s) => s.messages) };
}
