import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

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

  const hasText = input.trim().length > 0;

  return (
    <div className="relative flex items-end gap-2 border-t border-violet-100/50 p-3 bg-white/50">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Cookie about BIR forms..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none rounded-xl border border-violet-200/60 bg-white/80 px-3.5 py-2.5 pr-10 text-sm outline-none placeholder:text-violet-300 focus:border-violet-300 focus:ring-2 focus:ring-violet-100/50 disabled:opacity-50 min-h-[42px] max-h-[120px] transition-all duration-200"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !hasText}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-300/30 hover:shadow-violet-400/40 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none transition-all duration-200"
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
}
