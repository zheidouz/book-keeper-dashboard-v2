import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"; size?: "sm" | "md" | "lg" | "icon"; magnetic?: boolean }>(
  ({ className, variant = "default", size = "md", magnetic, ...props }, ref) => {
    const innerRef = React.useRef<HTMLButtonElement>(null);
    const [pos, setPos] = React.useState({ x: 0, y: 0 });

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 py-2 text-sm rounded-md",
      lg: "h-12 px-6 text-base rounded-lg",
      icon: "h-10 w-10 rounded-md",
    };

    const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
      if (!magnetic) return;
      const el = innerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2);
      if (dist < 50) {
        setPos({
          x: (e.clientX - rect.left - rect.width / 2) * 0.25,
          y: (e.clientY - rect.top - rect.height / 2) * 0.25,
        });
      } else {
        setPos({ x: 0, y: 0 });
      }
    }, [magnetic]);

    const handleMouseLeave = React.useCallback(() => {
      setPos({ x: 0, y: 0 });
    }, []);

    return (
      <button
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          (innerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          magnetic && "btn-magnetic",
          variants[variant],
          sizes[size],
          className
        )}
        onMouseMove={magnetic ? handleMouseMove : undefined}
        onMouseLeave={magnetic ? handleMouseLeave : undefined}
        style={magnetic ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : undefined}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
