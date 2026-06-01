import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border/50 p-3">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about BIR forms..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 disabled:opacity-50 min-h-[38px] max-h-[120px]"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
